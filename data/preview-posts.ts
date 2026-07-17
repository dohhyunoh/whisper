import { StrangerPost } from '@/utils/exchange-api';

// Marketing-only posts rendered by app/exchange/post-preview.tsx.
// These live purely on-device — they are never inserted into Supabase and the
// preview screen never calls the network. The screen is reachable only via
// deep link (whisper://exchange/post-preview), so real users never see it.
export const PREVIEW_POSTS: StrangerPost[] = [
  {
    id: 'preview-1',
    mood: 'windy',
    text: "I think my bf is cheating on me, he comes home like two hours after his work ends and always just says he works late but there's this one girl at his office that I know has a crush on him. What should I do to see if he's really cheating?",
    author_gender: 'Female',
    author_tags: ['emotion:overthinking', 'need:reassurance', 'tone:honest'],
  },
  {
    id: 'preview-2',
    mood: 'stormy',
    text: "my best friend liked my ex's photo from 2019 at 2am. what does this mean and how do i confront her without sounding insane",
    author_gender: 'Female',
    author_tags: ['emotion:anger', 'theme:trust', 'tone:direct'],
  },
  {
    id: 'preview-3',
    mood: 'cloudy',
    text: "if your partner's ex texted 'i still think about you' would you want to know or would you rather they just delete it?",
    author_gender: null,
    author_tags: null,
  },
  {
    id: 'preview-4',
    mood: 'clear',
    text: 'is checking your partner’s location stalking or just normal in 2026? be honest',
    author_gender: null,
    author_tags: null,
  },
  {
    id: 'preview-5',
    mood: 'windy',
    text: "my bf's mom liked a photo of me from 2021 at 1am. i've met her twice. i'm scared",
    author_gender: 'Female',
    author_tags: ['emotion:anxiety', 'tone:gentle'],
  },
  {
    id: 'preview-6',
    mood: 'stormy',
    text: 'my friend made a spotify blend with my ex. it says their music taste is 87% similar. mine was 62%',
    author_gender: 'Female',
    author_tags: null,
  },
  {
    id: 'preview-7',
    mood: 'cloudy',
    text: "saw my old best friend commented on my ex's post. they stayed friends. i lost them both",
    author_gender: 'Male',
    author_tags: ['emotion:loneliness', 'theme:letting-go', 'tone:gentle'],
  },
  {
    id: 'preview-8',
    mood: 'cloudy',
    text: "found out my friend group has a second group chat without me. i've been sending memes into the void for a year.",
    author_gender: null,
    author_tags: ['emotion:loneliness', 'need:belonging'],
  },
  {
    id: 'preview-9',
    mood: 'cloudy',
    text: "my best friend replied 'omg we have to hang out soon!!' to my story. we live 10 minutes apart. it's been 8 months",
    author_gender: 'Female',
    author_tags: null,
  },
];
