# World Events Network media replacement manifest

The current media remains in place as requested. Replace files at these stable slots without changing the surrounding layout or animation behavior.

| Page/section | Current file | Component/markup | Recommended subject | Ratio / dimensions | Fit / position | Animation dependency |
| --- | --- | --- | --- | --- | --- | --- |
| Homepage hero background | `/media/side-1.webp` and `/media/side-2.webp` | Homepage hero media | WEN event highlight or course/start-line footage | Existing template ratio | Existing CSS crop | Hero scroll interaction |
| Homepage experience 000 | `/assets/lottie/runman02.json` | Experience media strip | WEN race/event motion mark | Existing Lottie canvas | Existing | Lottie playback |
| Homepage experience 001 | `/assets/Clips/image-text.mp4` | Experience media strip | Race-day typography or participant footage | Existing video ratio | Existing | Scroll-triggered video |
| Homepage experience 002 | `/assets/Clips/open.mp4` | Experience media strip | Midnight marathon/event reveal | Existing video ratio | Existing | Scroll-triggered video |
| Homepage experience 003 | `/assets/Clips/remix-maze.mp4` | Experience media strip | Participant-growth campaign system | Existing video ratio | Existing | Scroll-triggered video |
| Homepage experience 004 | `/public/videos/rockstock/rockstockvideo.mp4` | Experience media strip | Live production / stage footage | Existing video ratio | Existing | Scroll-triggered video |
| About gallery | `/public/images/skottkerr/*` | About gallery | Approved WEN/Scott event imagery | Existing gallery ratios | `cover`, existing position | Gallery reveal |
| Scott Kerr hero/gallery | `/public/images/skottkerr/*` | Scott page gallery | Approved Scott/event leadership imagery | Existing gallery ratios | `cover`, existing position | Gallery reveal |
| Salt Lake City Marathon | `/public/images/slcmarathon/saltlakecityhalf_ut_featured.jpg` | Case-study hero | Approved SLC Marathon image | 4:3 | `cover`, existing | None |
| Rock 'n' Roll Salt Lake City | `/images/rocknrollseries/*` and `/assets/Clips/rocknrollseries2.mp4` | Case-study gallery/video | Approved race-day and course footage | Existing gallery/video ratios | Existing | Video controls and gallery hover |
| Bangkok Midnight Marathon | `/public/images/bangkok/bangkok-midnight-marathon.jpeg` | Case-study hero | Approved Bangkok event image | 4:3 | `cover`, existing | None |
| RockStock | `/public/images/rockstock/*` and `/public/videos/rockstock/rockstockvideo.mp4` | Case-study hero/gallery/video | Approved live production imagery | Existing ratios | Existing | Video controls / gallery |

Keep the existing file paths where possible so future replacements do not require markup changes.
