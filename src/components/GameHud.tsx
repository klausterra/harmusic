import {
  BADGES,
  levelFromXp,
  xpIntoLevel,
  type BadgeId,
  type GameState,
} from '../game/progress'
import './GameHud.css'

interface GameHudProps {
  game: GameState
  flashXp: number | null
  newBadge: BadgeId | null
}

export function GameHud({ game, flashXp, newBadge }: GameHudProps) {
  const level = levelFromXp(game.xp)
  const into = xpIntoLevel(game.xp)

  return (
    <aside className="hud" aria-label="Progresso">
      <div className="hud__row">
        <div className="hud__level">
          <span className="hud__label">LVL</span>
          <strong>{level}</strong>
        </div>
        <div className="hud__xp">
          <div className="hud__xp-meta">
            <span>XP</span>
            <span>
              {into}/100
              {flashXp ? (
                <em className="hud__xp-flash" key={`${game.xp}-${flashXp}`}>
                  +{flashXp}
                </em>
              ) : null}
            </span>
          </div>
          <div
            className="hud__xp-bar"
            role="progressbar"
            aria-valuenow={into}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ width: `${into}%` }} />
          </div>
        </div>
        <div className="hud__stat" title="Dias seguidos">
          <span className="hud__label">STREAK</span>
          <strong>{game.streakDays}d</strong>
        </div>
        <div
          className={
            game.combo > 1
              ? 'hud__stat hud__stat--combo is-hot'
              : 'hud__stat hud__stat--combo'
          }
          title="Combo"
        >
          <span className="hud__label">COMBO</span>
          <strong>x{Math.max(game.combo, 1)}</strong>
        </div>
      </div>

      {game.badges.length > 0 ? (
        <ul className="hud__badges" aria-label="Conquistas">
          {game.badges.map((id) => (
            <li key={id} title={BADGES[id].blurb}>
              {BADGES[id].title}
            </li>
          ))}
        </ul>
      ) : (
        <p className="hud__empty">Toque para desbloquear conquistas</p>
      )}

      {newBadge ? (
        <div className="hud__toast" role="status" key={newBadge}>
          <span>UNLOCK</span>
          <strong>{BADGES[newBadge].title}</strong>
          <p>{BADGES[newBadge].blurb}</p>
        </div>
      ) : null}
    </aside>
  )
}
