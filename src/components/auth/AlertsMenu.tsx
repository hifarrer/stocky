'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Trash2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface Alert {
  id: string;
  user_id: string;
  portfolio_item_id: string;
  symbol: string;
  market_type: 'stocks' | 'crypto' | 'forex';
  alert_type: 'price_up' | 'price_down' | 'change_up' | 'change_down';
  target_value: number;
  current_price?: number;
  is_triggered: boolean;
  triggered_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  portfolio_name?: string;
}

export function AlertsMenu() {
  const { user, token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadAlerts = useCallback(async () => {
    if (!token || !user) {
      console.log('AlertsMenu: No token or user, skipping load');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to load alerts:', errorData.error || 'Unknown error');
        // If token is invalid, clear it and logout
        if (response.status === 401) {
          console.log('Token invalid, clearing auth state');
          // Don't call logout here as it might cause redirect loops
        }
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data);
      } else {
        console.error('Failed to load alerts:', data.error);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (user && token) {
      loadAlerts();
      // Refresh alerts every 30 seconds
      const interval = setInterval(loadAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token, loadAlerts]);

  const handleDeleteAlert = async (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        await loadAlerts();
      } else {
        console.error('Failed to delete alert:', data.error);
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const triggeredAlerts = alerts.filter(a => a.is_triggered);
  const activeAlerts = alerts.filter(a => !a.is_triggered);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs flex items-center justify-center text-primary-foreground">
              {alerts.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-700">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Alerts</span>
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No alerts set up yet</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {triggeredAlerts.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Triggered Alerts
                </DropdownMenuLabel>
                {triggeredAlerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <DropdownMenuItem
                      className="flex items-start justify-between p-3 cursor-default"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.symbol}</span>
                          <Badge variant="secondary" className="text-xs">
                            {alert.market_type}
                          </Badge>
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Triggered
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {alert.alert_type === 'change_up' ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          {alert.alert_type === 'change_up' ? 'Up' : 'Down'} {alert.target_value}%
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteAlert(alert.id, e)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                    {index < triggeredAlerts.length - 1 && <DropdownMenuSeparator className="bg-slate-700" />}
                  </React.Fragment>
                ))}
                {activeAlerts.length > 0 && <DropdownMenuSeparator />}
              </>
            )}
            
            {activeAlerts.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Active Alerts
                </DropdownMenuLabel>
                {activeAlerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <DropdownMenuItem
                      className="flex items-start justify-between p-3 cursor-default"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.symbol}</span>
                          <Badge variant="secondary" className="text-xs">
                            {alert.market_type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {alert.alert_type === 'change_up' ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          {alert.alert_type === 'change_up' ? 'Up' : 'Down'} {alert.target_value}%
                        </div>
                        {alert.portfolio_name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {alert.portfolio_name}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteAlert(alert.id, e)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                    {index < activeAlerts.length - 1 && <DropdownMenuSeparator className="bg-slate-700" />}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

