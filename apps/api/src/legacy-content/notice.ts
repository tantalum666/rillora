export const contentNoticeVersion = '2026-10-22-1';
// Feature-specific notice: the current Web/iOS account agreements stay intact.
export const contentNotice = Object.freeze({
  version: contentNoticeVersion,
  en: {
    title: 'Files, voice and action packs',
    storage: 'Rillora stores the files, recordings, text and progress you choose to add in Frankfurt, Germany, using AWS. Content is encrypted with service-managed keys; this is not end-to-end encryption. Only upload content you are entitled to provide. Do not include passwords, recovery codes, seed phrases or private keys.',
    access: 'New content is private. A current share gives your selected, accepted contact access to the exact published version. A future intention does not grant access: verified post-death delivery is not available. Rillora does not verify death, grant legal authority or act for a provider.',
    retention: 'Stopping a subscription prevents new uploads and publications, but you can still read, download and delete existing content. Existing recipients can retrieve their published copies until you revoke access. You can remove files or delete your account; storage cleanup is retried before account deletion is reported complete. Encrypted database backups follow the Privacy Policy retention period (up to 90 days). Deleted content and revoked access are not re-enabled by a restore. Copies already downloaded cannot be recalled.',
    voice: 'Your original recording is retained. Text is an editable, separately confirmed account of the recording. Optional automatic transcription runs in a temporary browser worker on your device, using a fixed speech model downloaded from Rillora; recordings are not sent to an AI transcription provider. Model files may remain in the browser HTTP cache, but recordings and drafts are not written to browser storage. Only text you choose to save is sent to your Rillora account. Check names, numbers and wishes before confirming a draft. No voice cloning or automatic instruction changes are performed.',
    limits: 'This first release allows 128 MiB per account, 100 files, 8 MiB per file, and recordings up to 3 minutes. It does not include unlimited or permanent storage. The existing Privacy Policy and account closure/inactivity rules continue to apply.',
  },
  'zh-CN': {
    title: '文件、原声与亲友办理包',
    storage: 'Rillora 使用 AWS，将你选择添加的文件、录音、文字和办理记录保存在德国法兰克福。内容采用由服务管理密钥的加密方式，并非端到端加密。请只上传你有权提供的内容，不要包含密码、恢复码、完整助记词或私钥。',
    access: '新增内容仅本人可见。选择现在共享后，已接受邀请的指定联系人可以查看你明确发布的版本。将来披露的意向不会授予读取权限：真实身后核验交付目前尚未开放。Rillora 不判定死亡、不授予法律权限，也不代替机构办理。',
    retention: '停止订阅后不能新增上传或发布，但仍可读取、下载和删除已有内容。已获授权的接收人可继续取得发布给他们的副本，直到你撤销访问。删除文件或账号后，存储清理失败会重试；清理完成前不会报告账号已彻底删除。加密数据库备份沿用隐私政策的保留期限，最长 90 天；恢复备份不会重新开放已删除内容或已撤销的访问。对方已经下载的副本无法收回。',
    voice: '原始录音保持不变，文字是可编辑、需本人另行确认的记录。可选自动转写使用从 Rillora 下载的固定语音模型，在你设备上的临时浏览器工作进程中运行，不会把录音发送给 AI 转写供应商。模型文件可能留在浏览器的网络缓存中；录音和草稿不会写入浏览器持久存储，只有你主动保存的文字才会传到 Rillora 账号。请核对草稿中的姓名、数字和意愿；不会克隆声音或自动修改交代内容。',
    limits: '首版每个账号可保存 128 MiB、最多 100 份文件，单份不超过 8 MiB，单段录音不超过 3 分钟。服务不包含无限或永久存储。原隐私政策及账号关闭、长期不活跃规则继续适用。',
  },
});
