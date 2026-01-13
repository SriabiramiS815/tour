import { FunctionDeclaration, Type } from "@google/genai";
import { Destination } from "./types";

export const TEXT_MODEL = "gemini-2.0-flash-exp";
export const VOICE_MODEL = "gemini-2.0-flash-exp";
export const TRANSCRIPTION_MODEL = "gemini-2.0-flash-exp";

export const SYSTEM_INSTRUCTION = `
# Role
You are "Sri", a senior multilingual travel consultant for **Sri Tours**.
Your goal is to have a **natural, fluid conversation** with customers to plan their perfect trip.

# 🌏 Language & Voice Protocol (CRITICAL)
- **DETECT & MATCH (STRICT)**: You MUST detect the input language AND script.
  - **Hindi (Devanagari)** -> Reply in **Hindi (Devanagari)**.
  - **Hindi (English script/Hinglish)** -> Reply in **Hindi (English script/Hinglish)**.
  - **Tamil (Tamil Script)** -> Reply in **Tamil**.
  - **Tamil (English script/Tanglish)** -> Reply in **Tamil (English script/Tanglish)**.
  - **English** -> Reply in **English**.
  - **Other** -> Reply in **English** unless confident.
  - **NEVER** switch languages randomly. If the user starts in Hindi, STAY in Hindi until told otherwise.
- **Transliteration Awareness**: If a user writes "Kaise ho?" (Hindi in English), DO NOT reply in Devanagari. Reply in English script: "Main theek hoon!"
- **Be Conversational**: Do not sound robotic. Use warm, natural fillers appropriate for the language.
- **Voice Greeting Protocol (Start of Call)**:
  - When the call connects, you MUST immediately say: "Namaste! I am Sri. Which language do you prefer? English, Hindi, or Tamil?"
  - Wait for the user to answer before continuing in that language.

# 🧠 Behavioral Guidelines
- **Flexible Data Collection**:
  - Collect details (Name, Destination, Date, etc.) organically through conversation.
  - Don't interrogate the user. Mix questions with suggestions.
  - If the user is rushing, offer the Booking Form tool.
- **Accuracy**: verify details before confirming.

# 🚨 Booking & Confirmation Rule
Once you have all the necessary details (Destination, Duration, Package, Date, Name, Mobile, Email):
1. **Confirm**: summarize the details to the user.
2. **Execute**: Call the \`submit_booking_request\` tool.
   - This tool handles **BOTH** saving to the database and sending the confirmation email.
   - You do **NOT** need to call \`send_email\` separately.
3. **Close**: After the tool succeeds, thank the user and wish them a safe journey.

# Required Data for Booking
- Destination
- Duration
- Package Type (Budget/Standard/Premium)
- Travel Date
- Number of Travelers
- Transport Preference (Flight/Train/Bus/None)
- Hotel Preference (3/4/5 Star/Resort)
- Customer Name
- Customer Mobile
- Customer Email
`;

export const TOOLS: FunctionDeclaration[] = [
  {
    name: 'display_booking_form',
    description: 'Displays a visual form to the user to collect trip details faster. Use this if the user asks for it, or if data collection gets tedious.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prefill_destination: { type: Type.STRING }
      }
    }
  },
  {
    name: 'submit_booking_request',
    description: 'Finalizes the booking. Saves data to Supabase and sends the confirmation email to the customer. Call this ONLY when all details are collected and verified.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        destination: { type: Type.STRING },
        duration: { type: Type.STRING },
        package_type: { type: Type.STRING },
        travel_date: { type: Type.STRING },
        num_travelers: { type: Type.NUMBER },
        transport_type: { type: Type.STRING },
        hotel_rating: { type: Type.STRING },
        customer_name: { type: Type.STRING },
        customer_mobile: { type: Type.STRING },
        customer_email: { type: Type.STRING },
      },
      required: ['destination', 'duration', 'package_type', 'travel_date', 'num_travelers', 'customer_name', 'customer_mobile', 'customer_email']
    }
  }
];

export const ALL_DESTINATIONS: Destination[] = [
  // North India
  {
    id: 'agra',
    name: 'Agra (Taj Mahal)',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹8,000',
    tags: ['Heritage', 'Wonder'],
    category: 'North India'
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹12,000',
    tags: ['Palaces', 'Culture'],
    category: 'North India'
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹10,000',
    tags: ['Spiritual', 'Ghats'],
    category: 'North India'
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    image: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹9,500',
    tags: ['Yoga', 'Adventure'],
    category: 'North India'
  },

  // Himalayas
  {
    id: 'ladakh',
    name: 'Ladakh',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹25,000',
    tags: ['Adventure', 'Mountains'],
    category: 'Himalayas'
  },
  {
    id: 'kashmir',
    name: 'Kashmir',
    image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹22,000',
    tags: ['Nature', 'Snow'],
    category: 'Himalayas'
  },
  {
    id: 'manali',
    name: 'Manali',
    image: 'https://images.unsplash.com/photo-1580661869408-55ab23f2ca6e?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹15,000',
    tags: ['Hill Station', 'Snow'],
    category: 'Himalayas'
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    image: 'https://images.unsplash.com/photo-1544634076-a901606f41b8?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹18,000',
    tags: ['Tea', 'Hills'],
    category: 'Himalayas'
  },

  // South India
  {
    id: 'kerala_backwaters',
    name: 'Alleppey (Kerala)',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹14,000',
    tags: ['Backwaters', 'Relax'],
    category: 'South India'
  },
  {
    id: 'munnar',
    name: 'Munnar',
    image: 'https://images.unsplash.com/photo-1593693396865-78d5583e5ad1?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹12,000',
    tags: ['Tea', 'Hills'],
    category: 'South India'
  },
  {
    id: 'hampi',
    name: 'Hampi',
    image: 'https://images.unsplash.com/photo-1600100598914-3041956ccb58?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹9,000',
    tags: ['Ruins', 'History'],
    category: 'South India'
  },
  {
    id: 'ooty',
    name: 'Ooty',
    image: 'https://images.unsplash.com/photo-1517420847814-257a0753d0e2?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹11,000',
    tags: ['Hills', 'Nature'],
    category: 'South India'
  },
  {
    id: 'coorg',
    name: 'Coorg',
    image: 'https://images.unsplash.com/photo-1593693411515-c20d638e53ba?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹13,000',
    tags: ['Coffee', 'Hills'],
    category: 'South India'
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    image: 'https://images.unsplash.com/photo-1582556360534-118837267503?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹10,500',
    tags: ['French', 'Beaches'],
    category: 'South India'
  },
  {
    id: 'madurai',
    name: 'Madurai',
    image: 'https://images.unsplash.com/photo-1582555725350-b0c441c9b68d?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹8,500',
    tags: ['Temples', 'Culture'],
    category: 'South India'
  },
  {
    id: 'rameswaram',
    name: 'Rameswaram',
    image: 'https://images.unsplash.com/photo-1620138546344-7b2c38516cdf?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹9,000',
    tags: ['Pilgrimage', 'Sea'],
    category: 'South India'
  },

  // West India
  {
    id: 'goa',
    name: 'Goa',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹12,000',
    tags: ['Beaches', 'Party'],
    category: 'West India'
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹15,000',
    tags: ['Lakes', 'Romance'],
    category: 'West India'
  },
  {
    id: 'kutch',
    name: 'Rann of Kutch',
    image: 'https://images.unsplash.com/photo-1549643276-fbc2bd53630d?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹16,000',
    tags: ['Desert', 'Salt'],
    category: 'West India'
  },

  // East India
  {
    id: 'kolkata',
    name: 'Kolkata',
    image: 'https://images.unsplash.com/photo-1558431382-27e303142255?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹10,000',
    tags: ['Culture', 'City'],
    category: 'East India'
  },
  {
    id: 'gangtok',
    name: 'Gangtok',
    image: 'https://images.unsplash.com/photo-1582136081395-927906d0285a?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹18,500',
    tags: ['NorthEast', 'Hills'],
    category: 'East India'
  },

  // Islands
  {
    id: 'andaman',
    name: 'Andaman Islands',
    image: 'https://images.unsplash.com/photo-1589330273594-fade1ee91647?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹28,000',
    tags: ['Beaches', 'Diving'],
    category: 'Islands'
  },
  {
    id: 'lakshadweep',
    name: 'Lakshadweep',
    image: 'https://images.unsplash.com/photo-1631868817929-37e408546f60?q=80&w=1000&auto=format&fit=crop',
    startingPrice: '₹35,000',
    tags: ['Coral', 'Luxury'],
    category: 'Islands'
  }
];