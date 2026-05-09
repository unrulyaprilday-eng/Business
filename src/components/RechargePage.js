import React from 'react';
import { Button, Input, Alert, Typography } from 'antd';

const { Title, Text } = Typography;

const RechargePage = () => {
    return (
        <div style={{ padding: '20px' }}>
            {/* 充币标题 */}
            <Title level={4}>充币</Title>

            {/* USDT部分 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <img src="https://via.placeholder.com/30x30" alt="USDT logo" style={{ marginRight: '10px' }} />
                <Text strong>USDT</Text>
            </div>

            {/* 充值金额选项 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <Button type="default">1000 U <span style={{ color: 'red' }}>+1%</span></Button>
                <Button type="default">2000 U <span style={{ color: 'red' }}>+1%</span></Button>
                <Button type="default">5000 U <span style={{ color: 'red' }}>+0.5% +1%</span></Button>
                <Button type="default">10000 U <span style={{ color: 'red' }}>+1% +1%</span></Button>
                <Button type="default">20000 U <span style={{ color: 'red' }}>+1% +1%</span></Button>
                <Button type="default">50000 U <span style={{ color: 'red' }}>+1% +1%</span></Button>
            </div>

            {/* 提示信息 */}
            <Alert 
                message={<Text type="danger">实际转账的金额必须与输入的充值金额一致，否则可能无法快速自动到账</Text>}
                type="warning"
                showIcon
                style={{ marginBottom: '10px' }}
            />

            {/* 输入框 */}
            <Input addonAfter="USDT" placeholder="请输入充值金额" style={{ width: '300px', marginBottom: '10px' }} />

            {/* 立即充值按钮 */}
            <Button type="primary" block style={{ backgroundColor: '#87CEFA', borderColor: '#87CEFA' }}>
                立即充值
            </Button>

            {/* 温馨提示 */}
            <Title level={5} style={{ marginTop: '20px' }}>温馨提示:</Title>
            <ul>
                <li><Text type="danger">仅支持USDT充值, 网络为TRC20协议</Text></li>
                <li><Text type="danger">因充币地址不定期更换, 请在当前页面充值! 切勿保存地址充币, 否则自行承担损失!</Text></li>
                <li><Text type="danger">拉取订单后, 请勿修改金额。</Text></li>
            </ul>

            {/* 赠送说明 */}
            <Title level={5}>赠送说明:</Title>
            <ol>
                <li>笔笔送: 每一笔充值都赠送充值金额的1%。</li>
                <li>额外再送阶梯:
                    <ul>
                        <li>&gt;= 1000U 赠送 0U</li>
                        <li>&gt;= 2000U 赠送 0U</li>
                        <li>&gt;= 5000U 赠送 0.5%</li>
                        <li>&gt;= 10000U 赠送 1%</li>
                        <li>&gt;= 20000U 赠送 1%</li>
                        <li>&gt;= 50000U 赠送 1%</li>
                    </ul>
                </li>
            </ol>
        </div>
    );
};

export default RechargePage;