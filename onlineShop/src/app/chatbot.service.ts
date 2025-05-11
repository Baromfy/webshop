import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = '/api/chat';

  constructor(private http: HttpClient) {}

  sendMessage(messages: any[], model: string) {
    return this.http.post(this.apiUrl, { messages, model });
  }
}
