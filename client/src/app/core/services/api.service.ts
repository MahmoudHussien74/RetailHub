import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private normalize<T>(res: any): T {
    if (res && typeof res === 'object') {
      if (res.success !== undefined && res.isSuccess === undefined) {
        res.isSuccess = res.success;
      } else if (res.isSuccess !== undefined && res.success === undefined) {
        res.success = res.isSuccess;
      }
    }
    return res as T;
  }

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}/${path}`, { params: httpParams }).pipe(map(res => this.normalize<T>(res)));
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${path}`, body).pipe(map(res => this.normalize<T>(res)));
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${path}`, body).pipe(map(res => this.normalize<T>(res)));
  }

  patch<T>(path: string, body?: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${path}`, body).pipe(map(res => this.normalize<T>(res)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${path}`).pipe(map(res => this.normalize<T>(res)));
  }
}
