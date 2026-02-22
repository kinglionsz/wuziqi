import React from 'react'

/**
 * 游戏规则模态框
 */
export const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content rules-modal">
        <h2>五子棋游戏规则</h2>
        <div className="rules-content">
          <h3>基本规则</h3>
          <ul>
            <li>黑白双方轮流在棋盘上落子</li>
            <li>黑棋先行</li>
            <li>率先在一条直线连成五子的一方获胜</li>
            <li>棋盘下满无子可落且无一方获胜，则为平局</li>
          </ul>
          <h3>操作说明</h3>
          <ul>
            <li>点击棋盘空白处落子</li>
            <li>鼠标悬停可预览落子位置</li>
            <li>点击「悔棋」撤销上一步</li>
            <li>点击「回放」查看棋局</li>
          </ul>
        </div>
        <button onClick={onClose} className="modal-button">关闭</button>
      </div>
    </div>
  )
}
