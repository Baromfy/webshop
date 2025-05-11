import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatbotService } from '../chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  imports: [FormsModule, CommonModule],
})
export class ChatbotComponent implements OnInit {
  messages: { text: string, sender: 'user' | 'bot' }[] = [];
  userInput = '';
  isLoading = false;
  isOpen = false;
  OPENROUTER_API_KEY = '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'; // Replace with your actual key
  selectedModel = 'mistralai/mistral-7b-instruct:free'; // Default model


  constructor(private http: HttpClient, private chatbotService: ChatbotService) {}

  ngOnInit() {
    this.addBotMessage('Hello! I can help you with both laptop-specific questions and general knowledge queries. What would you like to know?');
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  addUserMessage(message: string) {
    this.messages.push({ text: message, sender: 'user' });
  }

  addBotMessage(message: string) {
    this.messages.push({ text: message, sender: 'bot' });
  }

  async sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage = this.userInput;
    this.addUserMessage(userMessage);
    this.userInput = '';
    this.isLoading = true;

    const messages = [
      {
        role: "system",
        content: "You're a helpful assistant who can answer both general knowledge questions and laptop-specific queries."
      },
      { role: "user", content: userMessage }
    ];

    try {
      const response: any = await this.chatbotService.sendMessage(messages, this.selectedModel).toPromise();
      const botResponse = response.choices[0].message.content;
      this.addBotMessage(botResponse);
    } catch (error) {
      this.addBotMessage("Sorry, I couldn't process your request.");
    } finally {
      this.isLoading = false;
    }
  }


  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
