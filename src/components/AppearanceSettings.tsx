import { History, Keyboard } from 'lucide-react'
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
      <fieldset className="settings-group">
        <legend>Theme</legend>
        <div className="theme-grid">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`theme-option${t.id === settings.themeId ? ' is-active' : ''}`}
              onClick={() => onChange({ ...settings, themeId: t.id })}
              aria-pressed={t.id === settings.themeId}
            >
              <span
                className="theme-swatch"
                style={{ background: t.background, borderColor: t.border }}
              >
                {/* Two digits so the preview shows the theme's tracking, not just its face. */}
                <span
                  className="theme-preview"
                  style={{
                    fontFamily: t.displayFont,
                    fontWeight: t.displayWeight,
                    letterSpacing: t.displayTracking,
                    color: t.text,
                  }}
                >
                  {sample}
                </span>
              </span>
              <span className="theme-name">{t.name}</span>
            </button>
          ))}
          <button
            className={`theme-option${settings.themeId === CUSTOM_THEME_ID ? ' is-active' : ''}`}
            onClick={() => onChange({ ...settings, themeId: CUSTOM_THEME_ID })}
            aria-pressed={settings.themeId === CUSTOM_THEME_ID}
          >
            <span
              className="theme-swatch"
              style={{ background: custom.background, borderColor: custom.border }}
            >
              <span
                className="theme-preview"
                style={{
                  fontFamily: custom.displayFont,
                  fontWeight: custom.displayWeight,
                  letterSpacing: custom.displayTracking,
                  color: custom.text,
                }}
              >
                {sample}
              </span>
            </span>
            <span className="theme-name">Custom</span>
          </button>
        </div>

        {/* Only while it is the theme in use, so the page behind the drawer is the
            preview and the section stays short for everybody else. */}
        {settings.themeId === CUSTOM_THEME_ID && (
          <div className="group-card">
            <CustomThemeControls custom={settings.customTheme} onChange={patchCustom} />
          </div>
        )}
      </fieldset>

      <fieldset className="settings-group">
        <legend>Animation</legend>
        <div className="animation-grid">
          {animations.map((a) => (
            <button
              key={a.id}
              className={`animation-option${a.id === settings.animationId ? ' is-active' : ''}`}
              onClick={() => onChange({ ...settings, animationId: a.id })}
              aria-pressed={a.id === settings.animationId}
            >
              <span className="animation-name">{a.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <hr className="settings-divider" />

      <fieldset className="settings-group">
        <legend>Session and backup</legend>
        <div className="button-grid">
          <button className="outline-button" onClick={onOpenSession}>
            <History size={15} aria-hidden="true" />
            Past picks
          </button>
          {/* A shortcut list is no use without a keyboard to press. */}
          {hasKeyboard && (
            <button className="outline-button" onClick={onOpenShortcuts}>
              <Keyboard size={15} aria-hidden="true" />
              Shortcuts
            </button>
          )}
        </div>
        <BackupControls
          settings={settings}
          session={session}
          lists={lists}
          onRestore={onRestore}
        />
      </fieldset>
    </>
  )
}
