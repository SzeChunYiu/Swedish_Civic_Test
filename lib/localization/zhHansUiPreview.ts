/**
 * Phase-2 Simplified Chinese UI preview copy.
 *
 * This is intentionally not wired into AppLanguage or release selection yet.
 * It gives reviewers a typed, testable slice for the settings screen and the
 * language picker while zh-Hans remains unavailable in lib/i18n/locales.ts and
 * blocked in docs/localization/readiness.json.
 */
export const zhHansUiPreview = {
  locale: 'zh-Hans',
  status: 'preview_only_release_blocked',
  sourceStyleGuide: 'docs/localization/sample-corpus/zh-Hans/style-guide.md',
  sourcePhrasebook: 'locales/zh-Hans/phrasebook.md',
  settings: {
    title: '设置',
    subtitle: '管理题目语言、语音朗读、主题和每日学习目标。',
    backToProfile: '← 返回个人页',
    backToProfileAccessibilityLabel: '返回个人页',
    questionLanguageTitle: '题目语言',
    languageAccessibilityLabelTemplate: '将题目语言设为 {label}',
    languageOptions: {
      sv: '瑞典语',
      en: '英语辅助',
    },
    audioTitle: '语音朗读',
    audioEnabledLabel: '语音朗读已开启',
    audioDisabledLabel: '语音朗读已关闭',
    enableAudioAccessibilityLabel: '开启语音朗读',
    disableAudioAccessibilityLabel: '关闭语音朗读',
    themeModeTitle: '主题',
    themeSystemLabel: '跟随系统',
    themeLightLabel: '浅色',
    themeDarkLabel: '深色',
    themeModeSummaryTemplate: '当前主题：{label}',
    setThemeModeAccessibilityLabelTemplate: '选择主题：{label}',
    dailyGoalTitle: '每日目标',
    dailyGoalSummaryTemplate: '每天答 {answerCount} 题',
    dailyGoalPresetLabels: {
      5: '快速练习',
      10: '稳步练习',
      20: '集中练习',
      40: '强化练习',
    },
    setDailyGoalAccessibilityLabelTemplate: '将每日目标设为 {goal} 题',
    importTitle: '导入学习数据',
    importSectionSubtitle:
      '粘贴本设备导出的 JSON 学习数据。写入前会先显示摘要，方便你确认。',
    importPurchasesNote: '购买、收据和应用内购数据不会导入。购买项目请通过应用商店恢复。',
    importPasteLabel: '粘贴 JSON 导出内容',
    importPastePlaceholder: '在这里粘贴导出内容',
    importPreview: '预览导入内容',
    importPreviewAccessibilityLabel: '预览本地学习数据导入',
    importReset: '清空导入框',
    confirmImport: '确认导入',
    confirmImportAccessibilityLabel: '确认导入本地学习数据',
    importSuccess: '导入已完成。',
    importSummaryTitle: '导入前摘要',
    importSummaryTemplates: {
      completedQuestions: '{count} 道题有保存的学习进度',
      bookmarks: '{count} 个收藏题目',
      wrongAnswers: '{count} 条错题复习记录',
      mockExams: '{count} 条模拟考试记录',
      fsrsCards: '{count} 张 FSRS 复习卡片',
      fsrsDays: '{count} 天 FSRS 复习记录',
      settings: '{count} 项设置',
      streakFreeze: '连续学习天数和冻结状态包含在内',
    },
    importErrors: {
      emptyInput: '请先粘贴 JSON，再预览。',
      invalidJson: '无法读取这段 JSON。',
      invalidSchema: '导入内容格式不正确，或包含未知的顶层字段。',
      unsupportedVersion: '暂不支持这个导入版本。',
      purchaseFieldsRejected:
        '导入内容包含购买、收据或应用内购字段。请移除这些字段，并通过应用商店恢复购买项目。',
      noSupportedStudyData: '导入内容中没有可支持的学习数据。',
    },
  },
  languagePicker: {
    triggerLabelTemplate: '当前语言为 {currentLabel}。打开语言选择器。',
    closeLabel: '关闭语言选择器',
    menuLabel: '语言选择器',
    title: '选择语言',
    subtitle:
      '界面翻译会分批加入。每种语言在完成人工审校前，题目内容仍使用瑞典语或英语。',
    unavailableSuffix: '，正在准备',
    comingSoon: '此语言版本正在准备中。',
  },
} as const;
