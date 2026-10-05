import { build } from 'esbuild';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));

test('actual form and guide components render both languages without changing source content', async () => {
const temporary = await mkdtemp(join(tmpdir(), 'rillora-forms-render-'));
const bundle = join(temporary, 'render.cjs');
try {
await build({stdin:{contents:`
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from './src/i18n/I18nProvider.jsx';
import { createLocaleStore } from './src/i18n/localeStore.js';
import { mergeCatalogs } from './src/i18n/core.js';
import * as forms from './src/i18n/messages/forms.js';
import * as common from './src/i18n/messages/common.js';
import { MatterForm } from './src/MatterForm.jsx';
import { FirstUseStarter, FirstUseGuide } from './src/FirstUsePanel.jsx';
import { SafetyPanel, ProviderGuidePanel } from './src/TaskPanels.jsx';
import { PlatformGuideDirectory } from './src/PlatformGuides.jsx';
import { toMatterDraft } from './src/matterForm.js';
import { getOfficialProviderGuide } from './src/officialProviderGuides.js';
const catalogs=mergeCatalogs(common,forms);
const noop=()=>{};
const Components={
  matter: <MatterForm isNew draft={toMatterDraft({title:'USER CONTENT 原文', category:'crypto_asset', notes:'UNCHANGED NOTE'})} onChange={noop}/>,
  starter: <FirstUseStarter plan={{firstUseState:'guide_paused'}} />,
  guide: <FirstUseGuide step={1} motivation='' />,
  safety: <SafetyPanel />,
  provider: <ProviderGuidePanel guide={getOfficialProviderGuide('apple')} />,
  directory: <PlatformGuideDirectory />,
};
export function render(name,locale){return renderToStaticMarkup(<I18nProvider catalogs={catalogs} locale={locale} store={createLocaleStore()}>{Components[name]}</I18nProvider>);}
`,resolveDir:root,loader:'jsx'},bundle:true,platform:'node',format:'cjs',outfile:bundle,jsx:'automatic',loader:{'.css':'empty','.svg':'dataurl','.png':'dataurl'},plugins:[{name:'url-assets',setup(build){build.onResolve({filter:/\?url$/},args=>({path:args.path,namespace:'asset-url'}));build.onLoad({filter:/.*/,namespace:'asset-url'},()=>({contents:'export default "/test-asset";',loader:'js'}));}}]});
const {render}=createRequire(import.meta.url)(bundle);
const cases={matter:['保存事项','名称','请选择交易所或链上钱包。','USER CONTENT 原文','UNCHANGED NOTE'],starter:['开始使用','继续引导'],guide:['主要原因','跳过此问题'],safety:['可以记录','没有回应绝不会触发自动披露。'],provider:['提前准备','上一步','lang="en"','Open Settings'],directory:['搜索平台','云服务与邮箱','lang="en"','Legacy Contact']};
for(const [name,expected] of Object.entries(cases)){
 const html=render(name,'zh-CN');
 for(const text of expected) assert.ok(html.includes(text),name+': '+text);
 assert.ok(!html.includes('forms.'),name+' unresolved key');
 const english=render(name,'en'); assert.ok(!english.includes('forms.'),name+' unresolved English key');
}
} finally {
  await rm(temporary, { recursive: true, force: true });
}
});
