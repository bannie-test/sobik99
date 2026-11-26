import { useState } from 'react';
import { t } from '../../cube-tools/utils/i18n.js';
import { defaultShortcuts, duplicateShortcuts, formatMoveNotation, MOVE_ROWS, shortcutFromEvent, type Shortcuts } from './shortcuts';

export function ShortcutSettings({ initial, onSave }: {
  initial: Shortcuts;
  onSave: (shortcuts: Shortcuts) => boolean;
}) {
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState('');
  const duplicates = duplicateShortcuts(draft);
  const missing = MOVE_ROWS.flat().some((move) => !draft[move]);

  return <details className="simulator-settings">
    <summary>{t('Cấu hình phím xoay', 'Configure turn keys')}</summary>
    <p id="simulator-key-help">{t(
      'Chọn một ô rồi bấm chữ cái, số hoặc Shift + chữ cái. Mỗi nước cần một phím riêng.',
      'Select a field and press a letter, digit, or Shift + letter. Assign a unique key to every move.',
    )}</p>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (duplicates.size || missing) return;
      setStatus(onSave(draft)
        ? t('Đã lưu cấu hình phím.', 'Keyboard shortcuts saved.')
        : t('Đã áp dụng cho phiên này. Trình duyệt không lưu được cấu hình.', 'Applied for this session. The browser could not save the settings.'));
    }}>
      <div className="simulator-bindings">
        {MOVE_ROWS.flat().map((move) => {
          const binding = draft[move];
          const duplicate = !!binding && duplicates.has(binding);
          return <label key={move}>
            <code>{formatMoveNotation(move)}</code>
            <input readOnly value={binding ?? ''} placeholder="—"
              aria-label={t(`Phím cho ${formatMoveNotation(move)}`, `Key for ${formatMoveNotation(move)}`)}
              aria-describedby={duplicate ? 'simulator-key-duplicates' : 'simulator-key-help'}
              aria-invalid={duplicate || undefined}
              onKeyDown={(event) => {
                const native = event.nativeEvent;
                if (native.repeat || native.isComposing || native.ctrlKey || native.altKey || native.metaKey) return;
                const clear = native.key === 'Backspace' || native.key === 'Delete';
                const shortcut = shortcutFromEvent(native);
                if (!clear && !shortcut) return;
                event.preventDefault();
                setStatus('');
                setDraft((current) => {
                  const next = { ...current };
                  if (shortcut) next[move] = shortcut;
                  else delete next[move];
                  return next;
                });
              }}
            />
          </label>;
        })}
      </div>
      {duplicates.size > 0 && <p id="simulator-key-duplicates" role="alert">
        {t('Phím bị trùng', 'Duplicate shortcuts')} · {[...duplicates].join(', ')}
      </p>}
      {missing && <p role="status">{t('Gán phím cho các nước còn trống để lưu.', 'Assign the remaining moves to save.')}</p>}
      <div className="actions">
        <button className="small-button primary" disabled={duplicates.size > 0 || missing}>{t('Lưu cấu hình', 'Save shortcuts')}</button>
        <button className="small-button" type="button" onClick={() => {
          setDraft(defaultShortcuts());
          setStatus(t('Đã nạp mặc định. Bấm Lưu cấu hình để áp dụng.', 'Defaults loaded. Save to apply them.'));
        }}>{t('Nạp phím mặc định', 'Load default keys')}</button>
      </div>
      <p role="status">{status}</p>
    </form>
  </details>;
}
