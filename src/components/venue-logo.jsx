import mokumLogo from '../assets/venues/mokum.png';
import boventijLogo from '../assets/venues/boventij.png'
import degrachtLogo from '../assets/venues/degracht.jpeg'
import planbLogo from '../assets/venues/planb.png'
import genericLogo from '../assets/venues/genericvenue.png'
import purplepoolLogo from '../assets/venues/purplepool.png'
import wizardsLogo from '../assets/venues/wizards.png'
import gocustomsLogo from '../assets/venues/gocustoms.png'

const MOKUM_POOL_DARTS_VENUE_ID = '60451687'
const BOVEN_T_IJ_VENUE_ID = '1172427'
const PLAN_B_VENUE_ID = '1167894'
const PLAN_B_VENUE_ID_2 = '1343989'
const DE_GRACHT_VENUE_ID = '1168481'
const PURPLE_POOL_VENUE_ID = '1126046'
const WIZARDS_VENUE_ID = '1168741'
const GOCUSTOMS_VENUE_ID = '32618059'

export default function VenueLogo({venueId}){
  switch(venueId){
    case MOKUM_POOL_DARTS_VENUE_ID:
      return <img src={mokumLogo} alt="" className="venue-logo" />
    case BOVEN_T_IJ_VENUE_ID:
      return <img src={boventijLogo} alt="" className="venue-logo" />
    case PLAN_B_VENUE_ID:
    case PLAN_B_VENUE_ID_2:
      return <img src={planbLogo} alt="" className="venue-logo" />
    case DE_GRACHT_VENUE_ID:
      return <img src={degrachtLogo} alt="" className="venue-logo" />
    case PURPLE_POOL_VENUE_ID:
      return <img src={purplepoolLogo} alt="" className="venue-logo" />
    case WIZARDS_VENUE_ID:
      return <img src={wizardsLogo} alt="" className="venue-logo" />
    case GOCUSTOMS_VENUE_ID:
      return <img src={gocustomsLogo} alt="" className="venue-logo" />
    default:
      return <img src={genericLogo} alt="" className="venue-logo" />
  }
}