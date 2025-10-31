import Calendar from '../assets/calendar-black.svg'
export default function DateRow({date}){
    const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
  return <span className='date-header'> <img src={Calendar} className="calendar-m" /> {formattedToday}</span>
}