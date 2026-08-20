import { History, Keyboard } from 'lucide-react'
import {
  AnimationGrid,
  AnimationName,
  AnimationOption,
  ThemeGrid,
  ThemeName,
  ThemeOption,
  ThemePreview,
  ThemeSwatch,
} from './AppearanceSettings.styled'
import { ButtonRow, Divider, Group, GroupCard, OutlineButton } from './drawer.styled'
import { buildCustomTheme, CUSTOM_THEME_ID, themes, type CustomTheme } from '@/lib/themes'
import { animations } from '@/lib/animations'
import type { CustomList } from '@/lib/lists'
import type { Session } from '@/lib/session'
import type { Settings } from '@/hooks/useSettings'
import { BackupControls } from './BackupControls'
import { CustomThemeControls } from './CustomThemeControls'

type AppearanceSettingsProps = {
  settings: Settings
  onChange: (next: Settings) => void
  session: Session
  lists: CustomList[]
  onRestore: (settings: Settings, session: Session, lists: CustomList[]) => void
  onOpenSession: () => void
  onOpenShortcuts: () => void
  /** The value on screen, previewed in the theme swatches. */
  sample: string
  /** Touch devices get no shortcut list; there is nothing to press. */
  hasKeyboard: boolean
}

/** Everything that changes *how* a pick looks, plus what to do with the ones already made. */
export function AppearanceSettings({
  settings,
  onChange,
  session,
  lists,
  onRestore,
  onOpenSession,
  onOpenShortcuts,
  sample,
  hasKeyboard,
}: AppearanceSettingsProps) {
  const custom = buildCustomTheme(settings.customTheme)
  const patchCustom = (patch: Partial<CustomTheme>) =>
    onChange({ ...settings, customTheme: { ...settings.customTheme, ...patch } })

  return (
    <>
      <Group>
        <legend>Theme</legend>
        <ThemeGrid>
          {themes.map((t) => (
            <ThemeOption
              key={t.id}
              $active={t.id === settings.themeId}
              onClick={() => onChange({ ...settings, themeId: t.id })}
              aria-pressed={t.id === settings.themeId}
            >
              <ThemeSwatch style={{ background: t.background, borderColor: t.border }}>
                {/* Two digits so the preview shows the theme's tracking, not just its face. */}
                <ThemePreview
                  style={{
                    fontFamily: t.displayFont,
                    fontWeight: t.displayWeight,
                    letterSpacing: t.displayTracking,
                    color: t.text,
                  }}
                >
                  {sample}
                </ThemePreview>
              </ThemeSwatch>
              <ThemeName>{t.name}</ThemeName>
            </ThemeOption>
          ))}
          <ThemeOption
            $active={settings.themeId === CUSTOM_THEME_ID}
            onClick={() => onChange({ ...settings, themeId: CUSTOM_THEME_ID })}
            aria-pressed={settings.themeId === CUSTOM_THEME_ID}
          >
            <ThemeSwatch style={{ background: custom.background, borderColor: custom.border }}>
              <ThemePreview
                style={{
                  fontFamily: custom.displayFont,
                  fontWeight: custom.displayWeight,
                  letterSpacing: custom.displayTracking,
                  color: custom.text,
                }}
              >
                {sample}
              </ThemePreview>
            </ThemeSwatch>
            <ThemeName>Custom</ThemeName>
          </ThemeOption>
        </ThemeGrid>

        {/* Only while it is the theme in use, so the page behind the drawer is the
            preview and the section stays short for everybody else. */}
        {settings.themeId === CUSTOM_THEME_ID && (
          <GroupCard>
            <CustomThemeControls custom={settings.customTheme} onChange={patchCustom} />
          </GroupCard>
        )}
      </Group>

      <Group>
        <legend>Animation</legend>
        <AnimationGrid>
          {animations.map((a) => (
            <AnimationOption
              key={a.id}
              $active={a.id === settings.animationId}
              onClick={() => onChange({ ...settings, animationId: a.id })}
              aria-pressed={a.id === settings.animationId}
            >
              <AnimationName>{a.name}</AnimationName>
            </AnimationOption>
          ))}
        </AnimationGrid>
      </Group>

      <Divider />

      <Group>
        <legend>Session and backup</legend>
        <ButtonRow>
          <OutlineButton onClick={onOpenSession}>
            <History size={15} aria-hidden="true" />
            Past picks
          </OutlineButton>
          {/* A shortcut list is no use without a keyboard to press. */}
          {hasKeyboard && (
            <OutlineButton onClick={onOpenShortcuts}>
              <Keyboard size={15} aria-hidden="true" />
              Shortcuts
            </OutlineButton>
          )}
        </ButtonRow>
        <BackupControls settings={settings} session={session} lists={lists} onRestore={onRestore} />
      </Group>
    </>
  )
}
