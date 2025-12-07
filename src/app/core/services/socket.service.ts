import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

export interface LocationUpdate {
    childId: string;
    lat: number;
    lng: number;
    battery: number;
    status: string;
    timestamp: string;
}

export interface StatusChange {
    childId: string;
    online: boolean;
    timestamp: string;
}

export interface PanicAlert {
    childId: string;
    lat: number;
    lng: number;
    timestamp: string;
}

@Injectable({
    providedIn: 'root'
})
export class SocketService implements OnDestroy {
    private authService = inject(AuthService);
    private apiService = inject(ApiService);

    private socket: Socket | null = null;

    // Subjects for emitting events
    private locationUpdatedSubject = new Subject<LocationUpdate>();
    private statusChangedSubject = new Subject<StatusChange>();
    private panicAlertSubject = new Subject<PanicAlert>();
    private connectionStatusSubject = new Subject<boolean>();

    // Observables for components to subscribe
    locationUpdated$ = this.locationUpdatedSubject.asObservable();
    statusChanged$ = this.statusChangedSubject.asObservable();
    panicAlert$ = this.panicAlertSubject.asObservable();
    connectionStatus$ = this.connectionStatusSubject.asObservable();

    private joinedRooms = new Set<string>();

    get isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    connect(): void {
        const token = this.authService.getToken();
        if (!token) {
            console.error('❌ Cannot connect socket: no auth token');
            return;
        }

        // Disconnect existing socket if any
        if (this.socket) {
            this.disconnect();
        }

        const baseUrl = this.apiService.getBaseUrl();
        console.log('🔌 Connecting to Socket.IO at', baseUrl);

        this.socket = io(baseUrl, {
            transports: ['websocket'],
            auth: { token },
            extraHeaders: { Authorization: `Bearer ${token}` },
            forceNew: true,
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);
            this.connectionStatusSubject.next(true);

            // Rejoin rooms after reconnection
            this.joinedRooms.forEach(childId => {
                this.socket?.emit('joinChildRoom', { childId });
            });
        });

        this.socket.on('disconnect', () => {
            console.log('⚠️ Socket disconnected');
            this.connectionStatusSubject.next(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            this.connectionStatusSubject.next(false);
        });

        // Listen for location updates
        this.socket.on('locationUpdated', (data: LocationUpdate) => {
            console.log('📍 Location update received:', data);
            this.locationUpdatedSubject.next(data);
        });

        // Listen for status changes (online/offline)
        this.socket.on('childStatusChanged', (data: StatusChange) => {
            console.log('👶 Child status changed:', data);
            this.statusChangedSubject.next(data);
        });

        // Listen for panic alerts
        this.socket.on('panicAlert', (data: PanicAlert) => {
            console.log('🚨 Panic alert received:', data);
            this.panicAlertSubject.next(data);
        });

        // Listen for room join confirmations
        this.socket.on('joined', (data: { room: string; childId: string }) => {
            console.log('🚪 Joined room:', data);
        });

        this.socket.on('error', (data: { message: string }) => {
            console.error('❌ Server error:', data.message);
        });
    }

    joinChildRoom(childId: string | number): void {
        const id = String(childId);
        if (this.socket?.connected) {
            console.log('📤 Joining child room:', id);
            this.socket.emit('joinChildRoom', { childId: id });
            this.joinedRooms.add(id);
        } else {
            console.warn('⚠️ Cannot join room: socket not connected');
            // Queue for later
            this.joinedRooms.add(id);
        }
    }

    leaveChildRoom(childId: string | number): void {
        const id = String(childId);
        if (this.socket?.connected) {
            this.socket.emit('leaveChildRoom', { childId: id });
        }
        this.joinedRooms.delete(id);
    }

    requestChildLocation(childId: string | number): void {
        const id = String(childId);
        if (this.socket?.connected) {
            console.log('📤 Requesting location for child:', id);
            this.socket.emit('requestLocation', { childId: id });
        }
    }

    disconnect(): void {
        console.log('🔌 Disconnecting socket...');
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.joinedRooms.clear();
        this.connectionStatusSubject.next(false);
    }

    ngOnDestroy(): void {
        this.disconnect();
        this.locationUpdatedSubject.complete();
        this.statusChangedSubject.complete();
        this.panicAlertSubject.complete();
        this.connectionStatusSubject.complete();
    }
}
