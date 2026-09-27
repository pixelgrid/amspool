import { useEffect } from 'react';
import { useMatchUpdates } from '../context/match-context.jsx';
import DisciplineImage from './discipline-image.jsx';

function LiveScoreNotification({ notification, onDismiss }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(notification.id), 5000);
    return () => window.clearTimeout(timeout);
  }, [notification.id, onDismiss]);

  return <div className={`live-score-notification ${notification.status} winner-${notification.winner}`} role="status">
    <div className="live-score-game">
      <span>{notification.teamA || 'Team A'}</span>
      <strong>{notification.gameScore.scoreA} - {notification.gameScore.scoreB}</strong>
      <span>{notification.teamB || 'Team B'}</span>
    </div>
    <div className="live-score-match">
      <span className="live-score-discipline"><DisciplineImage discipline={notification.discipline} /></span>
      <span className="live-score-race">RT{notification.raceTo || '?'}</span>
      <span className="live-score-player player-A">{notification.playerA || 'Player A'}</span>
      <strong className="live-score-score"><span className="scoreA">{notification.scoreA}</span><span className="score-separator"> - </span><span className="scoreB">{notification.scoreB}</span></strong>
      <span className="live-score-player player-B">{notification.playerB || 'Player B'}</span>
    </div>
  </div>;
}

export default function LiveScoreNotifications() {
  const { notifications, dismissNotification } = useMatchUpdates();

  return <div className="live-score-notifications" aria-label="Live score updates">
    {notifications.map(notification => <LiveScoreNotification
      key={notification.id}
      notification={notification}
      onDismiss={dismissNotification}
    />)}
  </div>;
}