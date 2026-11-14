# 1.0(18) 原手机直装

Status: INSTALLED AND LAUNCHED / OWNER MANUAL REVIEW PENDING / RESUBMISSION HELD
Last updated: 2026-11-05 (Asia/Hong_Kong)

Owner明确要求“推到我手机上我来再过一遍”，取代前一先提供截图的设备阶段；不解除重新提审或TestFlight暂停。

直接复用[上一轮修复](app-review-readiness-20261104.md)的开发签名IPA，SHA256为235f3d47d823272684ea14984b7737494084069227f5808e1030108efcd590fb，重新核对字节／签名及原手机Provisioning匹配；未重新构建或更改实现。设备列表起初缓存tunnel disconnected，实际详情查询建立有线连接，未向Owner重复要求连接或授权。

香港20:50在原配对iPhone16ProMax／iOS27.2完成原位安装，独立查询从build17读回build18，随后启动返回success。[安全回执](../collaboration/verification/native18-install-20261105/README.md)区分安装与真实页面结果。未卸载、清空数据、打开镜像、重新登录、更换Apple账号或进行购买／恢复；账号和原事项尚待Owner自行查看，不能仅凭安装宣称已读回。

当前唯一下一步是Owner打开「个人中心 → 套餐与权限」检查按钮是否稳定、是否还误跳法律页。先不用新购／恢复；如选择点订阅，只需核对进入正确购买流程，可在Apple系统最终确认前取消。原购买、恢复、到期及本机74项／6项结果沿用，不重测；App Store仍未上传或重新提审，下一版功能仍隔离。

原IPA已保存于archive60，本轮仅新增小型安全安装／启动回执和文档。设备原始响应、个人标识及临时解包副本不进公开Git；无需新归档。既有数据、定价、收费开关、FanPass保持，云端CI与子代理未使用。
