import eightballImage from '../assets/balls/8ball.png'
import nineballImage from '../assets/balls/9ball.png'
import tenballImage from '../assets/balls/10ball.png'
import fourteenballImage from '../assets/balls/straight.png'

export default function Discipline({discipline}){
  switch (discipline){
    case 2:
    case '2':
      return <img className="discipline" src={eightballImage} />
    case 3:
    case '3':
      return <img className="discipline" src={nineballImage} />
    case 4:
    case '4':
      return <img className="discipline" src={tenballImage} />
    case 5:
    case '5':
      return <img className="discipline" src={fourteenballImage} />
    default:
      return null;
  }
}