export interface Prop {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  description: string;
  movie: string;
  backstory: string;
  funFact?: string;
  year: number;
}

export const props: Prop[] = [
  {
    id: "flux-capacitor",
    title: "Flux Capacitor",
    imageUrl: "/images/props/flux-capacitor.jpg",
    description: "The heart of the time machine, this device makes time travel possible when the DeLorean reaches 88 mph.",
    movie: "Back to the Future",
    backstory: "The Flux Capacitor was invented by Doc Brown after he hit his head on the toilet while hanging a clock. The device requires 1.21 gigawatts of power to operate.",
    funFact: "The original prop was made from a Krups coffee grinder, which was also used in the movie Alien.",
    year: 1985,
  },
  {
    id: "hoverboard",
    title: "Hoverboard",
    imageUrl: "/images/props/hoverboard.jpg",
    description: "A levitating skateboard that became a cultural icon of the future.",
    movie: "Back to the Future Part II",
    backstory: "The hoverboard was a popular toy in 2015, though it was banned in Hill Valley due to safety concerns.",
    funFact: "The hoverboard prop was actually a modified skateboard with special effects added in post-production.",
    year: 2015,
  },
  {
    id: "mr-fusion",
    title: "Mr. Fusion",
    imageUrl: "/images/props/mr-fusion.jpg",
    description: "A revolutionary power source that converts household waste into energy.",
    movie: "Back to the Future Part II",
    backstory: "Mr. Fusion replaced the plutonium-powered nuclear reactor in the DeLorean, making time travel more accessible.",
    funFact: "The prop was created by modifying a Krups coffee grinder, similar to the Flux Capacitor.",
    year: 2015,
  },
];
