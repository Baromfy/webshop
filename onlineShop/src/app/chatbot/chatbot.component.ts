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
  OPENROUTER_API_KEY = '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';
  selectedModel = 'mistralai/mistral-7b-instruct:free';

  constructor(private http: HttpClient, private chatbotService: ChatbotService) {}

  ngOnInit() {
    this.testServerConnection();
    this.addBotMessage('Hello! I can answer your questions about laptops and computers. What would you like to know?');
  }

  testServerConnection() {
    this.http.get('/api/test').subscribe(
      (result) => console.log('Server connection successful:', result),
      (error) => console.warn('Failed to connect to server:', error)
    );
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

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage = this.userInput;
    this.addUserMessage(userMessage);
    this.userInput = '';
    this.isLoading = true;

    const messages = [
      { role: "user", content: userMessage }
    ];

    this.chatbotService.sendMessage(messages, this.selectedModel).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.choices && response.choices[0] && response.choices[0].message) {
          const botResponse = response.choices[0].message.content;
          this.addBotMessage(botResponse);
        } else {
          this.handleDirectApiCall(messages);
        }
      },
      error: (error) => {
        console.error('Server API error:', error);
        this.handleDirectApiCall(messages);
      }
    });
  }

  handleDirectApiCall(messages: any[]) {
    console.log('Trying direct API call...');
    
    this.http.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: this.selectedModel,
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.href,
          'Content-Type': 'application/json'
        }
      }
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.choices && response.choices[0] && response.choices[0].message) {
          const botResponse = response.choices[0].message.content;
          this.addBotMessage(botResponse);
        } else {
          this.addBotMessage("I received an unexpected response format. Please try again later.");
        }
      },
      error: (error) => {
        console.error('Direct API call error:', error);
        this.isLoading = false;
        this.addBotMessage("I'm unable to process your request at the moment. Please try again later.");
      }
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
