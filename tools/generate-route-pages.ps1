$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$content = Get-Content -Raw (Join-Path $root 'content\wen-content.json') | ConvertFrom-Json
$siteName = $content.site.name

function E([string]$value) { [System.Net.WebUtility]::HtmlEncode($value) }

function Page([string]$title, [string]$eyebrow, [string]$intro, [string]$body, [string]$cta = '', [string]$pageType = 'WebPage', [bool]$isService = $false) {
  $ctaMarkup = if ($cta) { "<a class='wen-cta' href='/contact'>$(E $cta)</a>" } else { '' }
  return @"
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>$(E $title) | $siteName</title><meta name="description" content="$(E $intro)"><meta property="og:title" content="$(E $title) | $siteName"><meta property="og:description" content="$(E $intro)"><meta property="og:type" content="website"><meta property="og:site_name" content="$siteName"><link rel="stylesheet" href="/route-shell.css"><link rel="stylesheet" href="/route-gallery.css"><link rel="icon" href="/favicon.ico"><script src="/wen-structured-data.js" defer></script><script src="/wen-form.js" defer></script></head><body data-wen-page="$(E $pageType)" data-wen-name="$(E $title)" data-wen-description="$(E $intro)" data-wen-service="$($isService.ToString().ToLower())"><div class="wen-route"><header class="wen-header"><a class="wen-brand" href="/">$siteName</a><nav class="wen-nav" aria-label="Primary"><a href="/about">About</a><a href="/expertise">Expertise</a><a href="/work">Work</a><a href="/contact">Let's Talk</a></nav></header><main class="wen-main"><p class="wen-eyebrow">$(E $eyebrow)</p><h1 class="wen-title">$(E $title)</h1><p class="wen-intro">$(E $intro)</p>$body$ctaMarkup</main><footer class="wen-footer"><span>$siteName · Scott Kerr</span><nav class="wen-footer-links" aria-label="Footer"><a href="/about">About</a><a href="/expertise">Expertise</a><a href="/work">Work</a><a href="/contact">Let's Talk</a></nav></footer></div></body></html>
"@
}

function Write-Route([string]$route, [string]$html) {
  $dir = Join-Path $root ($route.Trim('/').Replace('/', '\'))
  if ($route -eq '/') { $dir = $root }
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  $canonicalPath = if ($route -eq '/') { '/' } else { $route.TrimEnd('/') }
  $seo = "<link rel='canonical' href='$canonicalPath'><meta property='og:url' content='$canonicalPath'>"
  $html = $html.Replace('</head>', "$seo</head>")
  [IO.File]::WriteAllText((Join-Path $dir 'index.html'), $html, [Text.UTF8Encoding]::new($false))
}

$workCards = ($content.work | ForEach-Object { "<a href='/work/$($_.slug)'><span class='wen-index'>$($_.index)</span><span class='wen-card-title'>$(E $_.title)</span><span class='wen-card-meta'>$(E $_.category)</span></a>" }) -join ''
$rockPhotoNames = @(
  'Screenshot 2026-08-22 020238.webp',
  'Screenshot 2026-08-22 020304.webp',
  'Screenshot 2026-08-22 020427.webp',
  'Screenshot 2026-08-22 020520.webp',
  'Screenshot 2026-08-22 020543.webp',
  'Screenshot 2026-08-22 020838.webp',
  'Screenshot 2026-08-22 020924.webp',
  'Screenshot 2026-08-22 021003.webp',
  'Screenshot 2026-08-22 021023.webp',
  'Screenshot 2026-08-22 021132.webp',
  'Screenshot 2026-08-22 021156.webp',
  'Screenshot 2026-08-22 021338.webp',
  'Screenshot 2026-08-22 021415.webp',
  'Screenshot 2026-08-22 021601.webp',
  'Screenshot 2026-08-22 021631.webp'
)
$rockGallery = ($rockPhotoNames | ForEach-Object {
  $photoUrl = [uri]::EscapeDataString($_)
  "<figure class='wen-gallery-item'><img loading='lazy' src='/images/rocknrollseries/$photoUrl' alt='Rock &#39;n&#39; Roll Running Series event photo'><figcaption>Rock &#39;n&#39; Roll Running Series</figcaption></figure>"
}) -join ''
$rockVideo = "<div class='wen-media-video'><video controls playsinline preload='metadata' aria-label='Rock &#39;n&#39; Roll Salt Lake City course tour'><source src='/assets/Clips/rocknrollseries2.mp4' type='video/mp4'>Your browser does not support the video element.</video><p class='wen-media-video-caption'>Rock &#39;n&#39; Roll Salt Lake City course tour</p></div>"
$serviceCards = ($content.services | ForEach-Object { "<a href='/expertise/$($_.slug)'><span class='wen-card-title'>$(E $_.title)</span><span class='wen-card-meta'>Discuss this discipline</span></a>" }) -join ''
$expertiseImages = @(
  '/public/images/wonderwoman/images.jpg',
  '/public/images/slcmarathon/saltlakecityhalf_ut_featured.jpg',
  '/public/images/bangkok/bangkok-midnight-marathon.jpeg',
  '/images/rocknrollseries/Screenshot%202026-08-22%20020304.webp',
  '/public/images/wonderwoman/images%20(2).jpg',
  '/images/rocknrollseries/Screenshot%202026-08-22%20020838.webp',
  '/public/images/rockstock/rockstockcover.png',
  '/public/images/wonderwoman/images%20(1).jpg'
)
$expertiseImageAlt = 'Mass-participation sporting event in motion'

Write-Route '/about' (Page 'The Experience Behind the Experience.' 'World Events Network' 'World Events Network is an event consulting and management organization focused on developing, growing and delivering mass-participation sporting events and live experiences.' "<section class='wen-grid'><div class='wen-section'><h2>Senior expertise.</h2><p>The WEN model combines senior event leadership with a network of specialized professionals, partners and vendors assembled around the needs of each project.</p></div><div class='wen-section'><h2>Scott Kerr</h2><p>Event Strategist. Race Director. Producer.</p></div></section>" 'Discuss an Event')
$scottGallery = ($content.person.gallery | ForEach-Object { "<figure class='wen-gallery-item'><img loading='lazy' src='$($_)' alt='Scott Kerr, Founder and Principal of World Events Network'><figcaption>Scott Kerr</figcaption></figure>" }) -join ''
Write-Route '/scott-kerr' (Page 'Scott Kerr' 'World Events Network' 'Scott Kerr is the founder and principal behind World Events Network, bringing senior event leadership across mass-participation sports, event management, athlete recruitment, marketing and live production.' "<img class='wen-media' src='$($content.person.image)' alt='Scott Kerr, Founder and Principal of World Events Network'><div class='wen-media-gallery' aria-label='Scott Kerr portraits'>$scottGallery</div><section class='wen-grid'><div class='wen-section'><h2>Experience</h2><p>Event strategist, race director and producer.</p></div><div class='wen-section'><h2>World Events Network</h2><p>Senior expertise. The right team for the event.</p></div></section>" 'Start the Conversation')
Write-Route '/expertise' (Page 'Events Built to Perform.' 'World Events Network' 'World Events Network combines strategy, development, marketing and operations to help organizations launch, grow and deliver ambitious sporting and live events.' "<img class='wen-media wen-expertise-media' src='$($expertiseImages[0])' alt='Wonder Woman Run Series participants at race day' width='2468' height='1296'><div class='wen-list'>$serviceCards</div>" 'Discuss an Event')

for ($serviceIndex = 0; $serviceIndex -lt $content.services.Count; $serviceIndex++) {
  $service = $content.services[$serviceIndex]
  $capabilityList = ($service.capabilities | ForEach-Object { "<li>$(E $_)</li>" }) -join ''
  $image = $expertiseImages[$serviceIndex % $expertiseImages.Count]
  $body = "<img class='wen-media wen-expertise-media' src='$image' alt='$expertiseImageAlt' loading='eager'><section class='wen-grid'><div class='wen-section'><h2>The assignment</h2><p>Clarify the event objective, operating model and decisions required to move forward.</p></div><div class='wen-section'><h2>Capabilities</h2><ul>$capabilityList</ul></div><div class='wen-section'><h2>Approach</h2><p>WEN brings senior event leadership, practical planning and specialized support around the needs of the assignment.</p></div><div class='wen-section'><h2>Related experience</h2><p><a href='/work'>View selected work in motion.</a></p></div></section>"
  Write-Route "/expertise/$($service.slug)" (Page $service.title 'World Events Network' $service.intro $body 'Discuss an Event' 'WebPage' $true)
}

Write-Route '/work' (Page 'Experience in Motion.' 'World Events Network' 'Selected sporting and live event work spanning race management, international consulting, participant experience and production.' "<div class='wen-list'>$workCards</div>" 'Discuss an Event')
foreach ($project in $content.work) {
  if ($project.slug -eq 'rockstock') { continue }
  $media = if ($project.slug -eq 'rock-n-roll-salt-lake-city') {
    "$rockVideo<div class='wen-media-gallery' aria-label='Rock &#39;n&#39; Roll Running Series event photos'>$rockGallery</div>"
  } else {
    "<img class='wen-media' src='$($project.media)' alt='$(E $project.title) placeholder media'>"
  }
  $body = "$media<section class='wen-grid'><div class='wen-section'><h2>Category</h2><p>$(E $project.category)</p></div><div class='wen-section'><h2>The assignment</h2><p>$(E $project.summary)</p></div><div class='wen-section'><h2>Verification</h2><p>This case-study record is prepared conservatively and requires factual approval before expanded claims are published.</p></div></section>"
  Write-Route "/work/$($project.slug)" (Page $project.title 'World Events Network' $project.summary $body 'Discuss an Event' 'CreativeWork')
}

Write-Route '/insights' (Page 'Insights' 'World Events Network' 'Practical thinking about event development, participant growth, race operations, marketing, sponsorship, sports tourism and elite athletes.' "<section class='wen-grid'><div class='wen-section'><h2>Coming next</h2><p>Article architecture is prepared for future publication. No article bodies are published yet.</p></div></section>")
Write-Route '/event-growth-audit' (Page 'Registrations Stalled?' 'World Events Network' 'Advertising is only one factor behind event growth. World Events Network evaluates the complete event model to identify where participation may be getting stuck.' "<section class='wen-grid'><div class='wen-section'><h2>Audit areas</h2><ul><li>Concept and target audience</li><li>Date, location and competition</li><li>Pricing and registration</li><li>Website, conversion and advertising</li><li>Partnerships, email and retention</li><li>Participant experience and reputation</li></ul></div></section>" 'Request an Event Growth Audit')
Write-Route '/event-feasibility' (Page 'Before You Build the Event, Prove the Model.' 'World Events Network' 'World Events Network evaluates market demand, positioning, competition, operating requirements and commercial assumptions before significant resources are committed.' "<section class='wen-grid'><div class='wen-section'><h2>Assessment areas</h2><ul><li>Market, competition and date</li><li>Location, format and participant opportunity</li><li>Pricing and sponsorship opportunity</li><li>Operating complexity, costs and risks</li></ul></div></section>" 'Evaluate My Event Idea')
$contactBody = "<form class='wen-form' action='/contact' method='post' novalidate data-wen-contact-form><label for='name'>Name</label><input id='name' name='name' autocomplete='name' required><label for='organization'>Organization</label><input id='organization' name='organization' autocomplete='organization'><label for='email'>Email</label><input id='email' name='email' type='email' autocomplete='email' required><label for='message'>What are you trying to accomplish?</label><textarea id='message' name='message' required></textarea><button class='wen-cta' type='submit'>Start the Conversation</button><p class='wen-form-status' data-wen-form-status aria-live='polite' role='status'></p><p class='wen-form-fallback'>Submission routing is being configured. You can also <a href='https://www.linkedin.com/company/world-events-network/'>contact World Events Network on LinkedIn</a>.</p></form>"
Write-Route '/contact' (Page 'Start a Conversation' 'World Events Network' 'Strategy, development, operations and production for ambitious sporting and live events.' $contactBody)
Write-Route '/privacy' (Page 'Privacy' 'World Events Network' 'World Events Network privacy information.' "<section class='wen-grid'><div class='wen-section'><h2>Information</h2><p>Privacy policy content will be added before production launch.</p></div></section>")
Write-Route '/404' (Page 'Wrong Turn.' 'World Events Network' "This route isn't part of the course." "<p><a class='wen-cta' href='/'>Back to World Events Network</a></p>")
Copy-Item (Join-Path $root '404\index.html') (Join-Path $root '404.html') -Force
