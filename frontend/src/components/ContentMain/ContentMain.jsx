import "./ContentMain.css";
import Cards from "../Cards/Cards";

import Loans from "../Loans/Loans";
import Financial from "../Financial/Financial";

const ContentMain = () => {
  return (
    <div className="main-content-holder">
        <div className="content-grid-one">
            <Cards />
           
        </div>
        <div className="content-grid-two">
    
            <div className="grid-two-item">
            
            </div>

            <div className="grid-two-item">
              <div className="subgrid-two">
             
              </div>
            </div>
        </div>
    </div>
  )
}

export default ContentMain
