export default function HomePage() {
  return (
        <>
    <header>
      <img src="images/ism-logo.webp" alt="Instituto Privado Salvador Moncada Logo" />
        <h1>
           INSTITUTO PRIVADO SALVADOR MONCADA
        </h1>
        <button type="button" id="menu" title="Menu"></button>
        <nav id="nav-container">
            <ul>
            <li><a href="./webpage-project.html">HOME</a></li>
            <li><a href="./discover.html">DISCOVER</a></li>
            <li><a href="./register.html">REGISTER</a></li>
            <li><a href="records.html">RECORDS</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <div id="hero">
            <img id="ism-ad" src="images/ism-ad.webp" alt="Instituto Privado Salvador Moncada" />
        </div>
        <section class="card-1">
            <div id="card-1-text">
                <h2>
                    About Us
                </h2>
                <p>
                    The High School Salvador Moncada has its name as a tribute to the Honduran Doctor,
                    Sir Salvador Moncada, who did many contributions to the Science in the fields of inflammation,
                    vascular biology, and cell growth. Precisely, the mission of Salvador Moncada High School is 
                    to prepare the students for advancing in their academic careers to contribute to the
                    society in the fields where they are talented for, wether be Science or Arts.
                </p>
            </div>
            <picture id="science">
                <img src="images/ism-science.webp" alt="Science" />
            </picture>
        </section>
        <section class="card-2">
            <div id="card-2-text">
                <h2>
                    Address
                </h2>
                <p>
                    The High School Salvador Moncada is located in the city of San Pedro Sula, Honduras;
                    in the neighborhood of Barrio Rio de Piedras, southwest of the city, 9th Street, 23rd 
                    and 24th avenues, in front of Dryclean USA. Barrio Rio de Piedras is beside the mountain
                    known as El Merendon, habitat of many amazing animals like the emerald hummingbird,  
                    the rainbow toucan, and the gem beetle, all of them have visited the high school. 
                </p>
            </div>
            <div id="map">
            {/* Add a map showing the location of the school */}
             <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3844.694031726763!2d-88.04572710000002!3d15.500881500000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f665b7a2c918901%3A0x6936e1b7cc71c24!2s%22Our%20Legacy%22%20School!5e0!3m2!1ses!2shn!4v1765008756785!5m2!1ses!2shn" width="600" height="450" allowFullScreen title="Location of Instituto Privado Salvador Moncada" />
            </div>
        </section>
    </main>
    <footer>
        <div id="flag-container">
            <div id="text">
                <p>
                    &copy;<span id="currentyear"></span> | David Antonio Fajardo Ponce | Honduras            
                </p>            
            </div>                        
            <div id="flag">                        
                <img src ="images/Honduras_flag.webp" alt ="Honduras Flag" />
            </div>
        </div>
        <div id="social_media">
            {/* Facebook link */}
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" title="Visit our Facebook page">
                <img src="images/facebook_icon.svg" alt="Facebook" />
            </a>
            {/* YouTube link */}
            <a href="https://www.youtube.com/watch?v=eYJzbcT9A8A" target="_blank" rel="noopener noreferrer" title="Visit our YouTube channel">
                <img src="images/youtube_icon.svg" alt="YouTube" />
            </a>
            {/* LinkedIn link */}
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" title="Visit our LinkedIn page">
                <img src="images/linkedin_icon.svg" alt="David Fajardo LinkedIn" />
            </a>
        </div>
        <div id="update">
            {/* Last modified date */}
            <div class="last_modified">
                    <p>
                    Last Modified: <span id="lastModified"></span>
                    </p>
            </div>
            {/* Number of registered users */}
            <div class="review_count">
                <p>
                    Number of registered users: <span id="review-count">0</span>
                </p>
            </div>
        </div>
    </footer>
        </>
      );
    }