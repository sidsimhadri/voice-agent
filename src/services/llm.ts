// llm.ts

import OpenAI from 'openai';
import type { 
  ChatCompletionTool, 
  ChatCompletionMessage,
  ChatCompletionMessageParam 
} from 'openai/resources/chat/completions';
import config from '../config';

// Define more specific argument types for each function
interface NameArgs {
  name: string;
}

interface VehicleArgs {
  make: string;
  model: string;
  year: number;
  mileage?: number;
}

interface ServiceArgs {
  vehicleMake: string;
  mileage: number;
}

interface AvailabilityArgs {
  service: string;
}

interface AppointmentArgs {
  fullName: string;
  service: string;
  time: string;
}

// Define proper parameter types for tool functions
interface ToolParameters {
  type: 'object';
  properties: {
    [key: string]: {
      type: string;
      description: string;
      [key: string]: any;
    };
  };
  required: string[];
  [key: string]: any;
}

interface ToolFunction {
  name: string;
  description: string;
  parameters: ToolParameters;
  execute: (args: any) => string;
}

// Function to collect the user's full name.
function collectFullName(args: NameArgs): string {
  return JSON.stringify({ fullName: args.name });
}

// Function to collect the user's vehicle information.
function collectVehicleInfo(args: VehicleArgs): string {
  const { make, model, year, mileage = 0 } = args;
  return JSON.stringify({ vehicleMake: make, vehicleModel: model, vehicleYear: year, mileage });
}

// Function to recommend services based on vehicle make and mileage.
function recommendServices(args: ServiceArgs): string {
  const { vehicleMake, mileage = 0 } = args;
  const make = vehicleMake.toLowerCase();

  let recommended: string[] = [];

  if (['chrysler', 'dodge', 'jeep', 'ram'].includes(make)) {
    if (mileage >= 50000) {
      recommended.push('factory-recommended maintenance');
    } else {
      recommended.push('oil change', 'tire rotation', 'windshield wiper replacement');
    }
  } else if (['tesla', 'polestar', 'rivian'].includes(make)) {
    recommended.push('battery replacement', 'charging port diagnosis');
  } else {
    recommended.push('oil change', 'tire rotation', 'windshield wiper replacement');
  }

  return JSON.stringify({ recommendedServices: recommended });
}

// Function to suggest availabilities based on selected service type.
function suggestAvailability(args: AvailabilityArgs): string {
  const { service } = args;
  const isElectricService = ['battery replacement', 'charging port diagnosis'].includes(service);
  
  const availableTimes = isElectricService 
    ? ['1:00 PM', '3:00 PM', '5:00 PM']  // Electric vehicle times
    : ['2:00 PM', '4:00 PM', '6:00 PM'];  // ICE/Hybrid vehicle times

  return JSON.stringify({ 
    availableTimes,
    note: `Available Monday through Friday at ${availableTimes.join(', ')}`
  });
}

// Function to confirm the appointment details with the user.
function confirmAppointment(args: AppointmentArgs): string {
  const { fullName, service, time } = args;

  return JSON.stringify({
    confirmation: `Your appointment for a ${service} is scheduled at ${time}. Thank you, ${fullName}! Have a great day!`,
  });
}

// Define tools
export const tools: ToolFunction[] = [
  {
    name: 'collectFullName',
    description: "Collects the user's full name.",
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The full name of the user.',
        },
      },
      required: ['name'],
    },
    execute: collectFullName,
  },
  {
    name: 'collectVehicleInfo',
    description: "Collects the user's vehicle information such as make, model, and year.",
    parameters: {
      type: 'object',
      properties: {
        make: {
          type: 'string',
          description: "The make of the user's vehicle (e.g., Toyota).",
        },
        model: {
          type: 'string',
          description: "The model of the user's vehicle (e.g., Camry).",
        },
        year: {
          type: 'integer',
          description: "The year of the user's vehicle (e.g., 2020).",
        },
        mileage: {
          type: 'integer',
          description: "The current mileage of the vehicle (required for certain services).",
        },
      },
      required: ['make', 'model', 'year'],
    },
    execute: collectVehicleInfo,
  },
  {
    name: 'recommendServices',
    description: 'Recommends services based on the vehicle make and mileage.',
    parameters: {
      type: 'object',
      properties: {
        vehicleMake: {
          type: 'string',
          description: 'The make of the vehicle.',
        },
        mileage: {
          type: 'integer',
          description: 'The current mileage of the vehicle.',
        },
      },
      required: ['vehicleMake', 'mileage'],
    },
    execute: recommendServices,
  },
  {
    name: 'suggestAvailability',
    description: 'Suggests available times based on the selected service type.',
    parameters: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'The service selected by the user.',
        },
      },
      required: ['service'],
    },
    execute: suggestAvailability,
  },
  {
    name: 'confirmAppointment',
    description: 'Confirms the appointment details with the user.',
    parameters: {
      type: 'object',
      properties: {
        fullName: {
          type: 'string',
          description: 'The full name of the user.',
        },
        service: {
          type: 'string',
          description: 'The service selected by the user.',
        },
        time: {
          type: 'string',
          description: 'The selected appointment time.',
        },
      },
      required: ['fullName', 'service', 'time'],
    },
    execute: confirmAppointment,
  },
];

// Define initial messages
const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `You are an automotive service scheduling assistant. You MUST follow these steps in exact order, completing each step before moving to the next:

1. FIRST: Ask for and collect the customer's full name using collectFullName
2. SECOND: Once you have the name, collect vehicle details (make, model, year, mileage) using collectVehicleInfo
3. THIRD: After vehicle details are collected, use recommendServices to suggest appropriate services
4. FOURTH: After service recommendation, use suggestAvailability to show available times
5. FINALLY: Use confirmAppointment to finalize the booking

DO NOT SKIP STEPS OR JUMP AHEAD. Each step must be completed before proceeding.
Always wait for user input before proceeding to the next step.
Never suggest times or services before collecting all required information.

Start EVERY conversation by asking for the customer's full name.`
  }
];

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: config.togetherApiKey,
  baseURL: 'https://api.together.xyz/v1',
});

/**
 * Processes a user input and returns the AI response
 */
export async function processUserInputStream(userInput: string): Promise<ChatCompletionMessage> {
  try {
    // Add rate limiting check
    messages.push({ 
      role: 'user', 
      content: userInput 
    } as ChatCompletionMessageParam);

    const toolsForAPI: ChatCompletionTool[] = tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));

    const response = await client.chat.completions.create({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages,
      tools: toolsForAPI,
      tool_choice: 'auto',
      temperature: 0.7,
    });

    const message = response.choices[0].message;
    
    if (message.tool_calls?.[0]) {  
      const toolCall = message.tool_calls[0];
      const tool = tools.find(t => t.name === toolCall.function.name);
      
      if (tool) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = tool.execute(args);
        
        messages.push(message);
        messages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id
        } as ChatCompletionMessageParam);
        
        const secondResponse = await client.chat.completions.create({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages,
          tools: toolsForAPI,
          tool_choice: 'auto',
        });
        
        return secondResponse.choices[0].message;
      }
    }

    return message;
  } catch (error: any) {
    console.error('Error during conversation:', error.response?.data || error.message);
    throw error;
  }
}
