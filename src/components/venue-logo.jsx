import mokumLogo from '../assets/venues/mokum.png';
import boventijLogo from '../assets/venues/boventij.png'
import degrachtLogo from '../assets/venues/degracht.jpeg'
import planbLogo from '../assets/venues/planb.png'
import genericLogo from '../assets/venues/genericvenue.png'
import purplepoolLogo from '../assets/venues/purplepool.png'
import wizardsLogo from '../assets/venues/wizards.png'
import gocustomsLogo from '../assets/venues/gocustoms.png'
import njoyLogo from '../assets/venues/njoy.png'
import focusLogo from '../assets/venues/focus.png'
import renesLogo from '../assets/venues/rene.png'
import delfshavenLogo from '../assets/venues/delfshaven.png'
import desjoelLogo from '../assets/venues/desjoel.png'
import infinityLogo from '../assets/venues/infinity.png'
import padocLogo from '../assets/venues/padoc.png'
import cueactionLogo from '../assets/venues/cueaction.png'
import cuesdartsLogo from '../assets/venues/cuesdarts.png'
import walburgLogo from '../assets/venues/walburg.png'

const MOKUM_POOL_DARTS_VENUE_ID = '60451687'
const BOVEN_T_IJ_VENUE_ID = '1172427'
const BOVEN_T_IJ_VENUE_ID_2 = '2902906'
const PLAN_B_VENUE_ID = '1167894'
const PLAN_B_VENUE_ID_2 = '1343989'
const DE_GRACHT_VENUE_ID = '1168481'
const PURPLE_POOL_VENUE_ID = '1126046'
const WIZARDS_VENUE_ID = '1168741'
const GOCUSTOMS_VENUE_ID = '32618059'
const NJOY_VENUE_ID = '1184224'
const FOCUS_VENUE_ID = '62655235'
const RENES_VENUE_ID = '36729730'
const DELFSHAVEN_VENUE_ID = '1168520'
const DESJOEL_VENUE_ID = '60355510'
const INFINITY_VENUE_ID = '1168038'
const PADOC_VENUE_ID = '1172420'
const CUEACTION_VENUE_ID = '9191729'
const CUESDARTS_VENUE_ID = '1167973'
const WALBURG_VENUE_ID = '30113122'

export default function VenueLogo({venueId}){
  switch(venueId){
    case MOKUM_POOL_DARTS_VENUE_ID:
      return <img src={mokumLogo} alt="" className="venue-logo" />
    case BOVEN_T_IJ_VENUE_ID:
    case BOVEN_T_IJ_VENUE_ID_2:
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
    case RENES_VENUE_ID:
      return <img src={renesLogo} alt="" className="venue-logo" />
    case FOCUS_VENUE_ID:
      return <img src={focusLogo} alt="" className="venue-logo" />
    case NJOY_VENUE_ID:
      return <img src={njoyLogo} alt="" className="venue-logo" />
    case DELFSHAVEN_VENUE_ID:
      return <img src={delfshavenLogo} alt="" className="venue-logo" />
    case DESJOEL_VENUE_ID:
      return <img src={desjoelLogo} alt="" className="venue-logo" />
    case INFINITY_VENUE_ID:
      return <img src={infinityLogo} alt="" className="venue-logo" />
    case PADOC_VENUE_ID:
      return <img src={padocLogo} alt="" className="venue-logo" />
    case CUEACTION_VENUE_ID:
      return <img src={cueactionLogo} alt="" className="venue-logo" />
    case CUESDARTS_VENUE_ID:
      return <img src={cuesdartsLogo} alt="" className="venue-logo" />
    case WALBURG_VENUE_ID:
      return <img src={walburgLogo} alt="" className="venue-logo" />
    default:
      return <img src={genericLogo} alt="" className="venue-logo" />
  }
}