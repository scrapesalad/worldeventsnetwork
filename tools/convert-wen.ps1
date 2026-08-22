$files = @(
  (Join-Path $PSScriptRoot '..\index.html'),
  (Join-Path $PSScriptRoot '..\_next\static\chunks\3p2ia24p2ozer.js')
)

$replacements = [ordered]@{
  'Run Rob Run' = 'World Events Network'
  'Robert Aperios' = 'World Events Network'
  'mailto:hello@robertaperios.com' = '#contact'
  'action:"mailto:hello@robertaperios.com"' = 'action:"#contact"'
  'Creative' = 'WORLD'
  'Developer' = 'EVENTS'
  'Location' = 'Salt Lake City, Utah  Worldwide'
  'Building expressive digital experiences with thoughtful motion, strong typography, and modern front-end craft for brands, campaigns, and digital products across web and interactive spaces.' = 'World Events Network develops, grows and delivers mass-participation sporting events and live experiences through strategy, marketing, operations, athlete recruitment and production.'
  'Portfolio of World Events Network, a creative developer shaping thoughtful digital experiences through motion, typography, and front-end craft.' = 'World Events Network provides event strategy, marathon and race management, participant growth, event operations and elite-athlete expertise.'
  '<title>World Events Network</title>' = '<title>World Events Network | Sports & Mass Participation Event Experts</title>'
  'Tools' = 'Experience'
  '#tools' = '#expertise'
  'Let&#x27;s create' = 'Let&#x27;s Talk'
  "Let's create" = "Let's Talk"
  'Thoughtful ideas shaped with meaning' = 'Bold events built with purpose'
  'Bold systems built to hold attention' = 'World-class systems built to perform'
  'Visual systems' = 'Event Strategy'
  'Front-end craft' = 'Race Management'
  'Motion language' = 'Participant Growth'
  'Brand presence' = 'Elite Athletes'
  'Concept to form' = 'Live Production'
  'Building clear art direction, strong composition, and digital identities that feel distinctive and intentional.' = 'Turning ideas into viable event concepts with clear positioning, operating models and paths to growth.'
  'Developing responsive interfaces with thoughtful detail, smooth performance, and precise implementation.' = 'Directing complex running and mass-participation events from early planning through race-day execution.'
  'Using animation and interaction to guide attention, add atmosphere, and make the work feel alive.' = 'Building stronger event brands, registration strategies and marketing systems designed to grow participation.'
  'Translating ideas into polished launches, campaigns, and product surfaces that feel cohesive across touchpoints.' = 'Recruiting and coordinating professional athletes while building competitive fields that elevate an event.'
  'Shaping early ideas into clear visual systems that stay flexible, purposeful, and ready to evolve.' = 'Producing memorable sporting, entertainment and experiential events with disciplined operational execution.'
  'Runman' = 'Salt Lake City Marathon'
  'Chroma Warp' = "Rock 'n' Roll Salt Lake City"
  'Split Mask' = 'Bangkok Midnight Marathon'
  'Text Maze' = 'Wonder Woman Race Series'
  'Whale' = 'RockStock'
  'A lightweight looping motion mark used as a lead-in for the tool reel. It sets the pace before the video studies begin, keeping the section feeling alive from the first frame.' = 'Mass-participation event management and race direction experience.'
  'A motion study mixing image texture with live typography. Built as a reusable visual tool for quick art direction tests, combining layered media, responsive type, and script-controlled timing.' = 'Race direction and operations for complex sporting events.'
  'A compact interaction prototype for opening, masking, and revealing content. Designed around clean motion states, flexible layout logic, and a simple structure that can be reused across digital pieces.' = 'International event consulting for ambitious running experiences.'
  'A maze-like remix tool built for playful visual variation. It uses modern front-end scripting, procedural layout behavior, and graphic rules that can shift quickly without losing the overall system.' = 'Event marketing and participant growth systems.'
  'A sculptural motion experiment focused on weight, depth, and atmospheric movement. Built as a browser-friendly visual test using modern scripts and controlled animation pacing.' = 'Live event production and disciplined operational execution.'
  'Dash' = 'Salt Lake City Marathon'
  'Racepoint' = "Rock 'n' Roll Salt Lake City"
  'Commuter' = 'Bangkok Midnight Marathon'
  'Roger W Smith' = 'RockStock'
  'Webflow studio build' = 'Mass Participation Event Management'
  'Webflow editorial system' = 'Race Direction & Operations'
  'Webflow film portfolio' = 'International Event Consulting'
  'Webflow luxury archive' = 'Live Event Production'
  'A custom Webflow template shaped for a modern creative studio. Built with a sharp CMS structure, reusable sections, and script-led motion details that keep the portfolio fast, polished, and easy to extend.' = "Large-scale race direction, event operations and participant experience for one of Utah's signature running events."
  'A Webflow site with an editorial visual system, custom page templates, and a flexible component setup. Modern interactions and lightweight scripts bring movement to the layout without losing the clean, confident brand feel.' = "Race leadership and operational expertise supporting the arrival of the Rock 'n' Roll Running Series in Salt Lake City."
  'A cinematic Webflow portfolio built around immersive project presentation. Custom templates, CMS-driven media, and modern script enhancements give the site a bold rhythm while keeping updates straightforward.' = 'Event expertise supporting a major international running experience in one of Southeast Asia''s most dynamic cities.'
  'A refined Webflow build for a luxury watchmaker, designed around atmosphere, detail, and controlled pacing. The site uses custom templates, structured content, and subtle modern scripts to support a rich archive-like experience.' = 'A large-scale classic rock experience combining live entertainment, production and audience-focused event design.'
  'https://www.dashcreative.co/' = '/work/salt-lake-city-marathon'
  'https://racepointglobal.com/' = '/work/rock-n-roll-salt-lake-city'
  'https://www.commuterfilms.co.uk/' = '/work/bangkok-midnight-marathon'
  'https://rwsmithwatches.com/' = '/work/rockstock'
  'Alarm bells are ringing, Willie' = 'The finish line begins long before race day.'
  'Let me Run your next project!' = "Let's build what moves people."
  "It's the one you didn't expect. Not in the spotlight, but out there on the edge." = 'Strategy, development, operations and production for ambitious sporting and live events.'
  'Language' = 'Focus'
  'English' = 'Sports'
  'Dansk' = 'Events'
  'Português' = 'Consulting'
  'https://www.instagram.com' = 'https://www.linkedin.com/company/world-events-network/'
  'https://contra.com' = 'https://www.linkedin.com/in/scott-kerr-22889b3/'
  'https://www.linkedin.com"' = 'https://www.linkedin.com/company/world-events-network/"'
  'https://www.facebook.com"' = 'https://www.facebook.com/worldeventsnetwork/"'
  'Portrait of Robert Aperios' = 'Event leadership portrait placeholder'
  'Portrait of World Events Network' = 'Scott Kerr, Founder and Principal of World Events Network'
  '/media/me-2.webp' = '/images/scottkerr.png'
  '/public/images/scottkerr.png' = '/images/scottkerr.png'
  '/images/scottkerr.png' = '/public/images/skottkerr/Screenshot%202026-08-22%20020758.png'
  '/APERIOS' = '/WORLD EVENTS NETWORK'
  'R/APERIOS' = 'WORLD EVENTS NETWORK'
  'Thoughtful' = 'Bold'
  'ideas' = 'events'
  'shaped' = 'built'
  'with meaning' = 'with purpose'
  'It&#x27;s the one you didn&#x27;t expect. Not in the spotlight, but out there on the edge.' = 'Strategy, development, operations and production for ambitious sporting and live events.'
  '<a href="#expertise"><span class="topbar-link-label">Experience</span>' = '<a href="#expertise"><span class="topbar-link-label">Expertise</span>'
  '<a href="#expertise">Experience</a>' = '<a href="#expertise">Expertise</a>'
  'Salt Lake City, Utah  Worldwide<!-- -->:<!-- -->' = 'Salt Lake City, Utah  Worldwide'
  'locationPrefix:"Salt Lake City, Utah  Worldwide"' = 'locationPrefix:"Location"'
  'label:"Denmark"' = 'label:"Salt Lake City, Utah  Worldwide"'
  'label:"England"' = 'label:"Salt Lake City, Utah  Worldwide"'
  'label:"Portugal"' = 'label:"Salt Lake City, Utah  Worldwide"'
  '>Linkedin</a>' = '>World Events Network</a>'
  '>Instagram</a>' = '>Facebook</a>'
  '>Contra</a>' = '>Scott Kerr</a>'
  'label:"Linkedin"' = 'label:"World Events Network"'
  'label:"Facebook"' = 'label:"Scott Kerr"'
  'label:"Instagram"' = 'label:"Facebook"'
  'label:"Contra"' = 'label:"Scott Kerr"'
  'name:["Robert","Aperios"]' = 'name:["World","Events Network"]'
  'label:"Experience",href:"#expertise"' = 'label:"Expertise",href:"#expertise"'
  'locationPrefix:"Location"' = 'locationPrefix:"Salt Lake City, Utah  Worldwide"'
  '/media/side-2.webp","alt":"Side portrait two"' = '/public/images/skottkerr/scott1.png","alt":"Scott Kerr, Founder and Principal of World Events Network"'
  'src:"/media/side-2.webp",alt:"Side portrait two"' = 'src:"/public/images/skottkerr/scott1.png",alt:"Side portrait two"'
  '/public/videos/rockstock/rockstockvideo-web.mp4' = '/public/videos/rockstock/rockstockvideo.mp4'
  '"contactLinks":[{"label":"World Events Network","href":"https://www.linkedin.com"},{"label":"Scott Kerr","href":"https://www.facebook.com"},{"label":"Scott Kerr","href":"https://www.linkedin.com/company/world-events-network/"},{"label":"Scott Kerr","href":"https://www.linkedin.com/in/scott-kerr-22889b3/"}]' = '"contactLinks":[{"label":"World Events Network","href":"https://www.linkedin.com/company/world-events-network/"},{"label":"Scott Kerr","href":"https://www.linkedin.com/in/scott-kerr-22889b3/"},{"label":"Facebook","href":"https://www.facebook.com/worldeventsnetwork/"}]'
  'contactLinks:[{label:"World Events Network",href:"https://www.linkedin.com/company/world-events-network/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"},{label:"Facebook",href:"https://www.facebook.com/worldeventsnetwork/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"}]' = 'contactLinks:[{label:"World Events Network",href:"https://www.linkedin.com/company/world-events-network/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"},{label:"Facebook",href:"https://www.facebook.com/worldeventsnetwork/"}]'
  'contactLinks:[{label:"World Events Network",href:"https://www.linkedin.com/company/world-events-network/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"},{label:"Scott Kerr",href:"https://www.facebook.com/worldeventsnetwork/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"}]' = 'contactLinks:[{label:"World Events Network",href:"https://www.linkedin.com/company/world-events-network/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"},{label:"Facebook",href:"https://www.facebook.com/worldeventsnetwork/"}]'
  'site-footer-contact-list"><a href="https://www.linkedin.com/company/world-events-network/" class="site-footer-contact-link">World Events Network</a><a href="https://www.linkedin.com/in/scott-kerr-22889b3/" class="site-footer-contact-link">Scott Kerr</a><a href="https://www.facebook.com/worldeventsnetwork/" class="site-footer-contact-link">Facebook</a><a href="https://www.linkedin.com/in/scott-kerr-22889b3/" class="site-footer-contact-link">Scott Kerr</a></div>' = 'site-footer-contact-list"><a href="https://www.linkedin.com/company/world-events-network/" class="site-footer-contact-link">World Events Network</a><a href="https://www.linkedin.com/in/scott-kerr-22889b3/" class="site-footer-contact-link">Scott Kerr</a><a href="https://www.facebook.com/worldeventsnetwork/" class="site-footer-contact-link">Facebook</a></div>'
  '\"label\":\"Linkedin\"' = '\"label\":\"World Events Network\"'
  '\"label\":\"Facebook\"' = '\"label\":\"Scott Kerr\"'
  '\"label\":\"Instagram\"' = '\"label\":\"Facebook\"'
  '\"label\":\"Contra\"' = '\"label\":\"Scott Kerr\"'
  '\"name\":[\"Robert\",\"Aperios\"]' = '\"name\":[\"World\",\"Events Network\"]'
  '\"label\":\"Experience\",\"href\":\"#expertise\"' = '\"label\":\"Expertise\",\"href\":\"#expertise\"'
  '\"label\":\"Denmark\"' = '\"label\":\"Salt Lake City, Utah  Worldwide\"'
  '\"label\":\"England\"' = '\"label\":\"Salt Lake City, Utah  Worldwide\"'
  '\"label\":\"Portugal\"' = '\"label\":\"Salt Lake City, Utah  Worldwide\"'
  '<a href="https://www.facebook.com/worldeventsnetwork/" class="site-footer-contact-link">Facebook</a><a href="https://www.linkedin.com/company/world-events-network/" class="site-footer-contact-link">Facebook</a>' = '<a href="https://www.linkedin.com/in/scott-kerr-22889b3/" class="site-footer-contact-link">Scott Kerr</a><a href="https://www.facebook.com/worldeventsnetwork/" class="site-footer-contact-link">Facebook</a>'
  '/mock-work-images/Salt Lake City Marathon.webp' = '/mock-work-images/Dash.webp'
  "/mock-work-images/Rock 'n' Roll Salt Lake City.webp" = '/mock-work-images/Racepoint.webp'
  '/mock-work-images/Bangkok Midnight Marathon.webp' = '/mock-work-images/Commuter.webp'
  '/mock-work-images/Commuter.webp' = '/public/images/bangkok/bangkok-midnight-marathon.jpeg'
  '/mock-work-images/Dash.webp' = '/public/images/slcmarathon/saltlakecityhalf_ut_featured.jpg'
  '\"src\":\"/media/side-1.webp\",\"alt\":\"Side portrait one\"},{\"src\":\"/public/images/skottkerr/Screenshot%202026-08-22%20020758.png\",\"alt\":\"Scott Kerr, Founder and Principal of World Events Network\"}' = '\"src\":\"/public/images/skottkerr/Screenshot%202026-08-22%20020758.png\",\"alt\":\"Scott Kerr, Founder and Principal of World Events Network\"},{\"src\":\"/public/images/skottkerr/scotthero.png\",\"alt\":\"Scott Kerr, Founder and Principal of World Events Network\"}'
  'images:[{src:"/media/side-1.webp",alt:"Side portrait one"},{src:"/public/images/skottkerr/Screenshot%202026-08-22%20020758.png",alt:"Scott Kerr, Founder and Principal of World Events Network"}' = 'images:[{src:"/public/images/skottkerr/Screenshot%202026-08-22%20020758.png",alt:"Scott Kerr, Founder and Principal of World Events Network"},{src:"/public/images/skottkerr/scotthero.png",alt:"Scott Kerr, Founder and Principal of World Events Network"}'
}

foreach ($file in $files) {
  $text = [IO.File]::ReadAllText((Resolve-Path $file))
  $text = $text.Replace('<style id="wen-runtime-overflow">html,body{overflow-x:hidden}</style>', '')
  $text = $text.Replace('<style id="wen-scroll-sticky-fix">.page-entry-tools-sticky{align-self:stretch}</style>', '')
  $text = $text.Replace('<style id="wen-scroll-sticky-fix">.page-entry-tools-section{display:block}.page-entry-tools-sticky{align-self:stretch}</style>', '')
  if ($file -like '*3p2ia24p2ozer.js') {
    $match = [regex]::Match($text, 'let l0=(.*?),l1=', [Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $match.Success) { throw "Could not find embedded site data in $file" }
    $data = $match.Groups[1].Value
    foreach ($entry in $replacements.GetEnumerator()) {
      $data = $data.Replace($entry.Key, $entry.Value)
    }
    $text = $text.Substring(0, $match.Groups[1].Index) + $data + $text.Substring($match.Groups[1].Index + $match.Groups[1].Length)
    $text = [regex]::Replace($text, 'let l5=.*?,l4=', 'let l5={en:l0,da:l0,pt:l0},l4=', [Text.RegularExpressions.RegexOptions]::Singleline)
    $text = $text.Replace('action:"mailto:hello@robertaperios.com"', 'action:"#contact"')
    $text = $text.Replace('contactLinks:[{label:"World Events Network",href:"https://www.linkedin.com/company/world-events-network/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"},{label:"Scott Kerr",href:"https://www.facebook.com/worldeventsnetwork/"}]', 'contactLinks:[{label:"World Events Network",href:"https://www.linkedin.com/company/world-events-network/"},{label:"Scott Kerr",href:"https://www.linkedin.com/in/scott-kerr-22889b3/"},{label:"Facebook",href:"https://www.facebook.com/worldeventsnetwork/"}]')
    $text = $text.Replace('l="en"===a?t:l5[a]??t', 'l=l5[a]??t')
    $text = $text.Replace('suppressHydrationWarning:!0,', '')
  } else {
    foreach ($entry in $replacements.GetEnumerator()) {
      $text = $text.Replace($entry.Key, $entry.Value)
    }
    if (-not $text.Contains('/wen-structured-data.js')) {
      $text = $text.Replace('</head>', '<script src="/wen-structured-data.js" defer></script></head>')
    }
    if (-not $text.Contains('property="og:title"')) {
      $og = '<meta property="og:title" content="World Events Network | Sports & Mass Participation Event Experts"/><meta property="og:description" content="World Events Network provides event strategy, marathon and race management, participant growth, event operations and elite-athlete expertise."/><meta property="og:type" content="website"/><meta property="og:site_name" content="World Events Network"/>'
      $text = $text.Replace('</head>', $og + '</head>')
    }
    if (-not $text.Contains('rel="canonical"')) {
      $text = $text.Replace('</head>', '<link rel="canonical" href="/"/><meta property="og:url" content="/"/></head>')
    }
    $text = $text.Replace('\"contactLinks\":[{\"label\":\"World Events Network\",\"href\":\"https://www.linkedin.com\"},{\"label\":\"Scott Kerr\",\"href\":\"https://www.facebook.com\"},{\"label\":\"Scott Kerr\",\"href\":\"https://www.linkedin.com/company/world-events-network/\"},{\"label\":\"Scott Kerr\",\"href\":\"https://www.linkedin.com/in/scott-kerr-22889b3/\"}]', '\"contactLinks\":[{\"label\":\"World Events Network\",\"href\":\"https://www.linkedin.com/company/world-events-network/\"},{\"label\":\"Scott Kerr\",\"href\":\"https://www.linkedin.com/in/scott-kerr-22889b3/\"},{\"label\":\"Facebook\",\"href\":\"https://www.facebook.com/worldeventsnetwork/\"}]')
    $text = $text.Replace('\"contactLinks\":[{\"label\":\"World Events Network\",\"href\":\"https://www.linkedin.com/company/world-events-network/\"},{\"label\":\"Scott Kerr\",\"href\":\"https://www.linkedin.com/in/scott-kerr-22889b3/\"},{\"label\":\"Scott Kerr\",\"href\":\"https://www.facebook.com/worldeventsnetwork/\"}]', '\"contactLinks\":[{\"label\":\"World Events Network\",\"href\":\"https://www.linkedin.com/company/world-events-network/\"},{\"label\":\"Scott Kerr\",\"href\":\"https://www.linkedin.com/in/scott-kerr-22889b3/\"},{\"label\":\"Facebook\",\"href\":\"https://www.facebook.com/worldeventsnetwork/\"}]')
    $headingPrefix = '<span aria-hidden="true"><span><span class="page-entry-heading-word"><span class="page-entry-heading-word-hidden">World-class</span><span class="page-entry-heading-word-visible">World-class</span></span><span class="page-entry-heading-space" aria-hidden="true"> </span></span><span><span class="page-entry-heading-word"><span class="page-entry-heading-word-hidden">systems</span><span class="page-entry-heading-word-visible">systems</span></span><span class="page-entry-heading-space" aria-hidden="true"> </span></span><span><span class="page-entry-heading-word"><span class="page-entry-heading-word-hidden">built</span><span class="page-entry-heading-word-visible">built</span></span><span class="page-entry-heading-space" aria-hidden="true"> </span></span><span><span class="page-entry-heading-word"><span class="page-entry-heading-word-hidden">to</span><span class="page-entry-heading-word-visible">to</span></span><span class="page-entry-heading-space" aria-hidden="true"> </span></span><span><span class="page-entry-heading-word"><span class="page-entry-heading-word-hidden">perform</span><span class="page-entry-heading-word-visible">perform</span></span></span></span>'
    $text = [regex]::Replace($text, 'aria-label="World-class systems built to perform"><span aria-hidden="true">.*?</span></h2>', 'aria-label="World-class systems built to perform">' + $headingPrefix + '</h2>', [Text.RegularExpressions.RegexOptions]::Singleline)
  }
  [IO.File]::WriteAllText((Resolve-Path $file), $text, [Text.UTF8Encoding]::new($false))
}
