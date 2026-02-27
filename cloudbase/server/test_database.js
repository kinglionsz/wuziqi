/**
 * 数据库测试脚本
 * 用于验证 CloudBase 数据库连接和操作是否正常
 * 
 * 运行方式: 
 *   本地测试（需要配置密钥）:
 *     export TCB_SECRET_ID=your_secret_id
 *     export TCB_SECRET_KEY=your_secret_key
 *     node test_database.js
 * 
 *   云端测试（会自动从环境变量获取）:
 *     node test_database.js
 */

import cloudbase from '@cloudbase/node-sdk'

// 配置
const envId = process.env.TCB_ENV_ID || 'codebuddy-9gu42kpn62ead2e2'
const collectionName = 'wuziqi_rooms'

// 检查环境变量
console.log('========== 环境变量检查 ==========')
console.log('TCB_ENV_ID:', process.env.TCB_ENV_ID || '(未设置，使用默认)')
console.log('TCB_SECRET_ID:', process.env.TCB_SECRET_ID ? '(已设置)' : '(未设置)')
console.log('TCB_SECRET_KEY:', process.env.TCB_SECRET_KEY ? '(已设置)' : '(未设置)')
console.log('TCB_FUNCTION_NAME:', process.env.TCB_FUNCTION_NAME || '(未设置)')
console.log('===================================')
console.log('')

async function main() {
  console.log('========== CloudBase 数据库测试 ==========')
  console.log('envId:', envId)
  console.log('collectionName:', collectionName)
  console.log('')
  
  let app, db
  
  try {
    console.log('1. 初始化 CloudBase SDK...')
    
    // CloudBase SDK 会自动从环境变量获取凭证
    // TCB_SECRET_ID, TCB_SECRET_KEY, TCB_ENV_ID 等
    app = cloudbase.init({
      env: envId
    })
    db = app.database()
    console.log('   ✅ SDK 初始化成功')
  } catch (e) {
    console.error('   ❌ SDK 初始化失败:', e.message)
    console.error('')
    console.error('💡 提示:')
    console.error('   - 云端部署时: 确保 CloudBase 环境变量已配置')
    console.error('   - 本地测试时: 设置环境变量 TCB_SECRET_ID 和 TCB_SECRET_KEY')
    process.exit(1)
  }
  
  // 测试1: 检查并创建集合
  console.log('')
  console.log('2. 检查测试集合...')
  
  let collectionExists = false
  let existingData = null
  
  // 先尝试查询集合，检查是否存在
  try {
    const checkResult = await db.collection(collectionName).limit(1).get()
    if (checkResult.data) {
      collectionExists = true
      existingData = checkResult.data
      console.log('   ℹ️  发现集合:', collectionName)
      console.log('   集合内容:', JSON.stringify(existingData, null, 2))
    }
  } catch (e) {
    // 查询失败，可能是集合不存在或其他错误
    console.log('   ℹ️  集合不存在或查询失败:', e.message)
  }
  
  // 如果集合不存在，尝试创建
  if (!collectionExists) {
    console.log('   正在创建集合...')
    try {
      await db.createCollection(collectionName)
      console.log('   ✅ 集合创建成功')
    } catch (e) {
      if (e.message.includes('exists')) {
        console.log('   ℹ️  集合已存在（创建时检测到），继续...')
      } else {
        console.error('   ❌ 创建集合失败:', e.message)
      }
    }
  }
  
  // 测试2: 插入数据
  console.log('')
  console.log('3. 插入测试数据...')
  const testRoom = {
    roomId: 'TEST001',
    board: Array(15).fill(null).map(() => Array(15).fill(null)),
    players: {},
    status: 'waiting',
    currentTurn: 'black',
    moveHistory: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  
  try {
    const addResult = await db.collection(collectionName).add(testRoom)
    console.log('   ✅ 数据插入成功, id:', addResult.id)
  } catch (e) {
    console.error('   ❌ 插入数据失败:', e.message)
    console.error('')
    console.error('💡 可能原因:')
    console.error('   - 没有数据库操作权限')
    console.error('   - 凭证无效或已过期')
    process.exit(1)
  }
  
  // 测试3: 查询数据
  console.log('')
  console.log('4. 查询测试数据...')
  try {
    const queryResult = await db.collection(collectionName)
      .where({ roomId: 'TEST001' })
      .get()
    
    console.log('   ✅ 查询成功, 结果数量:', queryResult.data.length)
    if (queryResult.data.length > 0) {
      console.log('   数据:', JSON.stringify(queryResult.data[0], null, 2))
    }
  } catch (e) {
    console.error('   ❌ 查询数据失败:', e.message)
    process.exit(1)
  }
  
  // 测试4: 更新数据
  console.log('')
  console.log('5. 更新测试数据...')
  try {
    // 先删除旧数据
    await db.collection(collectionName)
      .where({ roomId: 'TEST001' })
      .remove()
    
    // 添加新数据
    const updatedRoom = { ...testRoom, status: 'playing', updatedAt: Date.now() }
    await db.collection(collectionName).add(updatedRoom)
    console.log('   ✅ 数据更新成功')
  } catch (e) {
    console.error('   ❌ 更新数据失败:', e.message)
    process.exit(1)
  }
  
  // 测试5: 删除数据
  console.log('')
  console.log('6. 删除测试数据...')
  try {
    const removeResult = await db.collection(collectionName)
      .where({ roomId: 'TEST001' })
      .remove()
    
    console.log('   ✅ 数据删除成功, 删除数量:', removeResult.deleted)
  } catch (e) {
    console.error('   ❌ 删除数据失败:', e.message)
    process.exit(1)
  }
  
  console.log('')
  console.log('========== 所有测试通过! ==========')
  console.log('')
  console.log('✅ 数据库连接正常，可以进行后续开发')
}

main().catch(e => {
  console.error('测试失败:', e)
  process.exit(1)
})
