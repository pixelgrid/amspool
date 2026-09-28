import Calendar from '../assets/calendar-black.svg'
export default function DateRow({date, expanded, controls, onClick}){
    const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
  return <button
    type="button"
    className="date-header date-header-toggle"
    aria-expanded={expanded}
    aria-controls={controls}
    onClick={onClick}
  >
    <img src={Calendar} className="calendar-m" alt="" />
    <span>{formattedToday}</span>
    <span className={`date-chevron${expanded ? ' expanded' : ''}`} aria-hidden="true" />
  </button>
}