export interface Message {
  id: string;
  role: 'user' | 'model' | 'system' | 'form';
  text: string;
  timestamp: Date;
  isError?: boolean;
  formData?: any;
  formSubmitted?: boolean;
}

export interface Booking {
  id: string;
  destination: string;
  duration: string;
  packageType: string;
  travelDate: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  status: 'confirmed' | 'pending';
  timestamp: Date;
}

export enum AppView {
  HOME = 'HOME',
  ASSISTANT = 'ASSISTANT'
}

export enum AgentMode {
  CHAT = 'CHAT',
  VOICE = 'VOICE'
}

export interface ToolCallData {
  name: string;
  args: Record<string, any>;
  id: string;
}

export interface Destination {
  id: string;
  name: string;
  image: string;
  startingPrice: string;
  tags: string[];
  category: 'North India' | 'South India' | 'East India' | 'West India' | 'Islands' | 'Himalayas';
}