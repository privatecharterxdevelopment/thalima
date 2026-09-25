/** Dropbox photo set — Thalima Photos and Videos folder */
export const yachtPhotos = {
  sailing: [
    { src: '/yacht/photos/1-sailing.jpg', caption: 'Under sail', alt: 'Thalima under sail' },
    { src: '/yacht/photos/2-sailing.jpg', caption: 'Under sail', alt: 'Thalima sailing on a reach' },
    { src: '/yacht/photos/3-sailing.jpg', caption: 'Under sail', alt: 'Thalima under full canvas' },
    { src: '/yacht/photos/4-sailing.jpg', caption: 'Under sail', alt: 'Thalima sailing' },
    { src: '/yacht/photos/5-sailing.jpg', caption: 'Under sail', alt: 'Thalima on the wind' },
    { src: '/yacht/photos/6-sailing.jpg', caption: 'Under sail', alt: 'Thalima sailing, aerial' },
    { src: '/yacht/photos/7-sailing.jpg', caption: 'Under sail', alt: 'Thalima sailing overhead' },
    { src: '/yacht/photos/8-sailing.jpg', caption: 'Under sail', alt: 'Thalima under sail at dusk' },
    { src: '/yacht/photos/9-sailing.jpg', caption: 'Under sail', alt: 'Thalima sailing profile' },
  ],
  deck: [
    { src: '/yacht/photos/10-anchor.jpg', caption: 'At anchor', alt: 'Thalima at anchor' },
    { src: '/yacht/photos/11-deck.jpg', caption: 'Deck', alt: 'Teak decks looking forward' },
    { src: '/yacht/photos/12-deck.jpg', caption: 'Deck', alt: 'Foredeck and sunpads' },
    { src: '/yacht/photos/13-deck.jpg', caption: 'Deck', alt: 'Deck and cockpit' },
    { src: '/yacht/photos/14-deck-night.jpg', caption: 'Evening', alt: 'Deck at night' },
    { src: '/yacht/photos/15-cockpit.jpg', caption: 'Cockpit', alt: 'Guest cockpit' },
  ],
  saloon: [
    { src: '/yacht/photos/15-saloon.jpg', caption: 'Saloon', alt: 'Saloon seating' },
    { src: '/yacht/photos/17-saloon.jpg', caption: 'Saloon', alt: 'Saloon dining' },
    { src: '/yacht/photos/18-saloon.jpg', caption: 'Saloon', alt: 'Saloon after the 2024 refit' },
    { src: '/yacht/photos/19-saloon.jpg', caption: 'Saloon', alt: 'Saloon looking aft' },
    { src: '/yacht/photos/20-saloon.jpg', caption: 'Saloon', alt: 'Saloon detail' },
    { src: '/yacht/photos/21-saloon.jpg', caption: 'Saloon', alt: 'Saloon seating and table' },
  ],
  lounge: [
    { src: '/yacht/photos/22-lounge.jpg', caption: 'Lounge', alt: 'TV lounge' },
    { src: '/yacht/photos/23-lounge.jpg', caption: 'Lounge', alt: 'Lounge seating' },
  ],
  owner: [
    { src: '/yacht/photos/24-owner-cabin.jpg', caption: 'Owner suite', alt: 'Owner suite' },
    { src: '/yacht/photos/25-owner-cabin.jpg', caption: 'Owner suite', alt: 'Owner suite with skylights' },
    { src: '/yacht/photos/26-owner-cabin.jpg', caption: 'Owner suite', alt: 'Owner suite desk' },
    { src: '/yacht/photos/28-owner-cabin.jpg', caption: 'Owner suite', alt: 'Owner suite looking aft' },
    { src: '/yacht/photos/30-owner-cabin.jpg', caption: 'Owner suite', alt: 'Owner suite study' },
    { src: '/yacht/photos/31-owner-head.jpg', caption: 'Owner ensuite', alt: 'Owner ensuite' },
  ],
  cabins: [
    { src: '/yacht/photos/32-vip-cabin.jpg', caption: 'VIP cabin', alt: 'VIP cabin' },
    { src: '/yacht/photos/33-port-guest-cabin.jpg', caption: 'Guest cabin', alt: 'Port guest cabin' },
    { src: '/yacht/photos/34-port-guest-cabin.jpg', caption: 'Guest cabin', alt: 'Port twin cabin' },
    { src: '/yacht/photos/35-stbd-guest-cabin.jpg', caption: 'Guest cabin', alt: 'Starboard guest cabin' },
    { src: '/yacht/photos/36-stbd-guest-cabin.jpg', caption: 'Guest cabin', alt: 'Starboard twin cabin' },
    { src: '/yacht/photos/36-aft-corridor.jpg', caption: 'Companionway', alt: 'Aft corridor' },
  ],
  galley: [
    { src: '/yacht/photos/37-galley.jpg', caption: 'Galley', alt: 'Galley' },
    { src: '/yacht/photos/38-galley.jpg', caption: 'Galley', alt: 'Galley island' },
    { src: '/yacht/photos/39-galley.jpg', caption: 'Galley', alt: 'Galley range' },
    { src: '/yacht/photos/40-nav-station.jpg', caption: 'Nav station', alt: 'Navigation station' },
  ],
  ga: { src: '/yacht/photos/sw110-ga.jpg', caption: 'General arrangement', alt: 'SW110 Thalima GA' },
} as const

export const yachtVideos = {
  deckWalkthrough: '/yacht/videos/deck-walkthrough.mp4',
  deckHero: '/yacht/videos/deck-hero.mp4',
  interiorWalkthrough: '/yacht/videos/interior-walkthrough.mp4',
} as const

export type YachtShot = {
  src: string
  caption: string
  alt: string
  span?: 'wide' | 'tall'
  group?: 'deck' | 'interior'
}

export function allDeckShots(): YachtShot[] {
  return [
    { ...yachtPhotos.sailing[6], span: 'wide', group: 'deck' },
    { ...yachtPhotos.sailing[1], span: 'tall', group: 'deck' },
    { ...yachtPhotos.sailing[0], group: 'deck' },
    { ...yachtPhotos.deck[0], group: 'deck' },
    { ...yachtPhotos.deck[1], group: 'deck' },
    { ...yachtPhotos.deck[5], span: 'wide', group: 'deck' },
    { ...yachtPhotos.deck[4], group: 'deck' },
    { ...yachtPhotos.sailing[4], group: 'deck' },
    { ...yachtPhotos.sailing[7], group: 'deck' },
    { ...yachtPhotos.deck[2], group: 'deck' },
    { ...yachtPhotos.deck[3], group: 'deck' },
  ]
}

export function allInteriorShots(): YachtShot[] {
  return [
    { ...yachtPhotos.owner[0], span: 'wide', group: 'interior' },
    { ...yachtPhotos.owner[1], span: 'tall', group: 'interior' },
    { ...yachtPhotos.owner[2], group: 'interior' },
    { ...yachtPhotos.owner[3], group: 'interior' },
    { ...yachtPhotos.owner[4], span: 'wide', group: 'interior' },
    { ...yachtPhotos.owner[5], group: 'interior' },
    { ...yachtPhotos.cabins[0], group: 'interior' },
    { ...yachtPhotos.cabins[1], group: 'interior' },
    { ...yachtPhotos.cabins[2], span: 'wide', group: 'interior' },
    { ...yachtPhotos.cabins[3], group: 'interior' },
    { ...yachtPhotos.cabins[4], group: 'interior' },
    { ...yachtPhotos.cabins[5], group: 'interior' },
    { ...yachtPhotos.saloon[1], span: 'wide', group: 'interior' },
    { ...yachtPhotos.saloon[2], group: 'interior' },
    { ...yachtPhotos.saloon[3], group: 'interior' },
    { ...yachtPhotos.saloon[0], group: 'interior' },
    { ...yachtPhotos.lounge[0], group: 'interior' },
    { ...yachtPhotos.lounge[1], span: 'wide', group: 'interior' },
    { ...yachtPhotos.galley[0], group: 'interior' },
    { ...yachtPhotos.galley[1], group: 'interior' },
    { ...yachtPhotos.galley[2], span: 'wide', group: 'interior' },
    { ...yachtPhotos.galley[3], group: 'interior' },
  ]
}
