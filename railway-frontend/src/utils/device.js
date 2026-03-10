/**
 * 设备识别工具
 * 用于生成和管理匿名用户ID
 */

const DEVICE_ID_KEY = 'wuziqi_device_id'
const PLAYER_NAME_KEY = 'wuziqi_player_name'

/**
 * 生成随机设备ID
 * @returns {string}
 */
function generateDeviceId() {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `device_${timestamp}_${randomPart}`
}

/**
 * 获取设备ID (如果不存在则创建)
 * @returns {string}
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)

  if (!deviceId) {
    deviceId = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}

/**
 * 获取玩家名称
 * @returns {string|null}
 */
export function getPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY)
}

/**
 * 设置玩家名称
 * @param {string} name
 */
export function setPlayerName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, name)
}

/**
 * 清除设备ID (用于重置)
 */
export function clearDeviceId() {
  localStorage.removeItem(DEVICE_ID_KEY)
  localStorage.removeItem(PLAYER_NAME_KEY)
}

/**
 * 检查是否是首次使用
 * @returns {boolean}
 */
export function isFirstTime() {
  return !localStorage.getItem(DEVICE_ID_KEY)
}