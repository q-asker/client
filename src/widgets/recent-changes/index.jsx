import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import './index.css';

const RecentChanges = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="recent-changes-section">
      <h3>{t('최근 변경사항')}</h3>
      <ul className="changes-list">
        {changes.map((log, index) => (
          <li key={log.id || index}>
            <span className="date">{formatDate(log.dateTime)}</span>
            <span className="change-text">{t(log.updateText)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentChanges;
