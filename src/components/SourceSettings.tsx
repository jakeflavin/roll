import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { allSources, sources, type SourceId } from '@/lib/sources'
import { isCustomId, type CustomList } from '@/lib/lists'
import type { Settings } from '@/hooks/useSettings'

type SourceSettingsProps = {
  settings: Settings
  onChange: (next: Settings) => void
  lists: CustomList[]
  onCreateList: () => void
  /** Open a custom list's editor, or a built-in group's full pool. */
  onEditList: (id: SourceId | null) => void
  onViewOptions: (id: SourceId) => void
}

/**
 * Everything that changes *what* gets picked: the groups in play, their own settings,
 * and whether a value can come up twice.
 */
export function SourceSettings({
  settings,
  onChange,
  lists,
  onCreateList,
  onEditList,
  onViewOptions,
}: SourceSettingsProps) {
  const available = allSources(lists)
  const unused = available.filter((s) => !settings.sourceIds.includes(s.id))

  // Clamp on commit rather than on every keystroke, so a half-typed number stays editable.
  const commitRange = () => {
    const min = Math.min(settings.min, settings.max)
    const max = Math.max(settings.min, settings.max)
    if (min !== settings.min || max !== settings.max) onChange({ ...settings, min, max })
  }

  /** A group's own settings, as rows inside that group's card. They read as belonging
   *  to the group above them rather than as more controls in a flat stack. */
  const groupRows = (id: SourceId) => {
    const group = available.find((s) => s.id === id)
    const rows = []

    if (id === 'number') {
      rows.push(
        <div className="group-field" key="range">
          <label>
            Min
            <input
              type="number"
              value={settings.min}
              onChange={(e) => onChange({ ...settings, min: Number(e.target.value) })}
              onBlur={commitRange}
            />
          </label>
          <label>
            Max
            <input
              type="number"
              value={settings.max}
              onChange={(e) => onChange({ ...settings, max: Number(e.target.value) })}
              onBlur={commitRange}
            />
          </label>
        </div>,
      )
    }

    if (id === 'letter') {
      rows.push(
        // Associated by id rather than nested: a checkbox inside its own label gets the
        // click twice — once directly, once forwarded — and lands back where it started.
        <div className="group-field is-switch" key="case">
          <label htmlFor="both-cases">Include lowercase</label>
          <input
            id="both-cases"
            type="checkbox"
            role="switch"
            checked={settings.bothCases}
            onChange={(e) => onChange({ ...settings, bothCases: e.target.checked })}
          />
        </div>,
      )
    }

    // Navigation, so it reads as a link with somewhere to go, not as another control
    // carrying the same weight as the group's own dropdown.
    if (isCustomId(id)) {
      rows.push(
        <button className="group-link" key="edit" onClick={() => onEditList(id)}>
          Edit entries
          <ChevronRight size={15} aria-hidden="true" />
        </button>,
      )
    } else if (group?.options) {
      rows.push(
        <button className="group-link" key="see" onClick={() => onViewOptions(id)}>
          See all {group.options.length}
          <ChevronRight size={15} aria-hidden="true" />
        </button>,
      )
    }

    return rows
  }

  return (
    <>
      <fieldset className="settings-group">
        <legend>Pick from</legend>
        {/* One card per group: the dropdown chooses it, the rows beneath belong
            to it. Cards keep several groups from reading as one flat stack of
            identical boxes. */}
        {settings.sourceIds.map((id, i) => (
          <div className="group-card" key={`${id}-${i}`}>
            <div className="group-head">
              <div className="select-wrap">
                <select
                  className="select is-bare"
                  value={id}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      sourceIds: settings.sourceIds.map((sid, index) =>
                        index === i ? (e.target.value as SourceId) : sid,
                      ),
                    })
                  }
                >
                  <optgroup label="Built in">
                    {sources
                      .filter((s) => s.id === id || !settings.sourceIds.includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                  {lists.length > 0 && (
                    <optgroup label="Your lists">
                      {lists
                        .filter((l) => l.id === id || !settings.sourceIds.includes(l.id))
                        .map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="select-arrow" size={16} aria-hidden="true" />
              </div>
              {settings.sourceIds.length > 1 && (
                <button
                  className="ghost-button"
                  onClick={() =>
                    onChange({
                      ...settings,
                      sourceIds: settings.sourceIds.filter((_, index) => index !== i),
                    })
                  }
                  aria-label={`Remove ${available.find((s) => s.id === id)?.name}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {groupRows(id)}
          </div>
        ))}

        <div className="add-row">
          {unused.length > 0 && (
            <div className="select-wrap is-add">
              <select
                className="select is-add"
                value=""
                onChange={(e) =>
                  e.target.value &&
                  onChange({ ...settings, sourceIds: [...settings.sourceIds, e.target.value] })
                }
              >
                <option value="">Add a group</option>
                {unused.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Plus className="select-arrow is-left" size={15} aria-hidden="true" />
            </div>
          )}
          <button
            className="link-button"
            onClick={() => {
              onCreateList()
              // The new list takes the first slot, and is what the editor shows. Straight
              // into it: a new list is empty, so staying here looks like nothing happened.
              onEditList(null)
            }}
          >
            Custom list
          </button>
        </div>
      </fieldset>

      {/* A row rather than a titled group: the label on the switch says the whole
          thing, so a heading above it would only repeat itself. */}
      <div className="settings-group switch-row">
        <label htmlFor="repeat">Repeat picks</label>
        <input
          id="repeat"
          type="checkbox"
          role="switch"
          checked={settings.repeat}
          onChange={(e) => onChange({ ...settings, repeat: e.target.checked })}
        />
      </div>
    </>
  )
}
