# Traditional Chinese Glossary

Status: phase-1 glossary. Use with `docs/localization/sample-corpus/zh-Hant/style-guide.md`.

## Source notes

This phase uses Swedish/English official sources for Sweden facts and Traditional Chinese official/public-service sources for register. Useful Traditional Chinese register patterns include:

- civic/legal vocabulary such as `主權在民`, `人民自由權利`, `地方自治`, `權利義務`, `依法行政`, and `法治` from Taiwan constitutional/legal explainers
- service and immigration UI vocabulary such as `網站導覽`, `查詢`, `列印`, `申辦服務`, `線上申辦`, `申請進度查詢`, `停留`, `居留`, and `永久居留` from Taiwan government service pages
- concise explanatory patterns such as `這表示...`, `也就是...`, `例如...`, and `依規定...`

Use these sources for Traditional Chinese voice only. Use Swedish official sources for Swedish institutions and citizenship facts. Do not map Swedish institutions to Taiwanese, Hong Kong, PRC, or other institutions.

## Civic terms

| Swedish/English concept | zh-Hant rendering | Notes |
|---|---|---|
| Sweden | 瑞典 | Use consistently. |
| Swedish | 瑞典的 / 瑞典語 | Choose adjective/language by context. |
| Swedish citizenship | 瑞典公民身分 / 瑞典國籍 | `公民身分` for learner UI; `國籍` for legal nationality. |
| Swedish Migration Agency | 瑞典移民局（Migrationsverket） | Keep Swedish name on first mention. |
| residence permit | 居留許可 | Swedish context may need `瑞典居留許可`; native/legal review required. |
| permanent residence permit | 永久居留許可 | Do not assume Taiwan `永久居留` exactly maps to Sweden. |
| application | 申請 | Use `提出申請` / `申請...`; avoid Mainland-only style if possible. |
| decision | 決定 / 作出決定 | Use natural verb structure. |
| democracy | 民主 / 民主制度 | Use `代議民主` for representative democracy. |
| rule of law | 法治 / 法治國家 | `依法行政` for administrative legality. |
| constitution | 憲法 | |
| fundamental laws | 基本法 / 基本法律 | Swedish context needs explanation; avoid HK Basic Law confusion. |
| Riksdag | 瑞典議會（Riksdag） | Do not use `全國人大`, `立法院`, or `國會` as substitution. |
| government | 政府 | Avoid conflating with `國家`. |
| government agency/public authority | 機關 / 主管機關 / 政府機關 | Choose by context; exact Swedish agency names where known. |
| municipality / kommun | 市鎮（kommun） | Explain as Swedish local self-government level. |
| region | 大區 / 區域層級 | Explain Swedish elected regional level; do not use province analogies. |
| rights | 權利 | |
| duties/obligations | 義務 / 責任 | `義務` for legal/civic duties. |
| rights and duties | 權利與義務 | Natural civic pair. |
| freedom of expression | 言論自由 / 表達自由 | Choose by sentence. |
| discrimination | 歧視 | Define with plain examples when needed. |
| gender equality | 性別平等 | Rights-based, neutral. |
| source criticism | 來源辨識 / 資料來源判讀 | Learner-friendly; avoid overly academic wording. |

## UI term decisions

| English app term | zh-Hant candidate | Notes |
|---|---|---|
| practice | 練習 | Short app term. |
| start practice | 開始練習 | Short CTA. |
| continue practice | 繼續練習 | Short CTA. |
| question | 題目 / 問題 | Use `題目` in quiz UI. |
| answer | 答案 / 回答 | `答案` for options/result; `回答` for user action. |
| answer option | 選項 | |
| explanation | 解析 / 答案解析 | Study-app style. |
| correct | 答對了 / 回答正確 | Warm feedback. |
| incorrect | 這次選錯了 | Non-shaming. |
| source | 資料來源 | Natural source label. |
| source material | 參考資料 / 資料來源 | Choose by context. |
| coming soon | 此語言版本仍在準備中 | Public-information tone. |
| local device | 這台裝置 | Privacy/local-storage copy. |

## Variant and style warnings

- Do not produce `zh-Hant` by character-converting Simplified Chinese.
- Avoid Simplified forms and Mainland-only institutional terms.
- Avoid Hong Kong-only terms unless a future locale decision chooses Hong Kong convention.
- Do not translate `Riksdag` as `全國人大`, `立法院`, or another local institution.
- Do not use `省政府` or `縣市政府` as substitutes for Swedish regions/municipalities.
- Keep punctuation Traditional Chinese: `。！？；：、「」『』`.
- Legal/civic terms such as citizenship, residence permit, and migration requirements need native/legal review before release.
