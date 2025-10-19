'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, AlertCircle, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface EconomicEvent {
  id: string;
  time: string;
  date: Date;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  country: string;
  category: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  currency?: string;
}

interface EconomicCalendarProps {
  maxEvents?: number;
  className?: string;
}

// Mock economic events data (in a real app, this would come from an API)
const generateMockEvents = (): EconomicEvent[] => {
  const today = new Date();
  const events: EconomicEvent[] = [];

  // Market hours events
  events.push({
    id: 'market-open',
    time: '09:30',
    date: today,
    title: 'US Market Open',
    description: 'NYSE and NASDAQ trading begins',
    impact: 'high',
    country: 'US',
    category: 'Market Hours',
  });

  events.push({
    id: 'market-close',
    time: '16:00',
    date: today,
    title: 'US Market Close',
    description: 'NYSE and NASDAQ regular trading ends',
    impact: 'high',
    country: 'US',
    category: 'Market Hours',
  });

  // Economic indicators
  events.push({
    id: 'unemployment',
    time: '08:30',
    date: addDays(today, 1),
    title: 'Unemployment Claims',
    description: 'Initial jobless claims data release',
    impact: 'medium',
    country: 'US',
    category: 'Employment',
    forecast: '220K',
    previous: '218K',
  });

  events.push({
    id: 'gdp',
    time: '08:30',
    date: addDays(today, 2),
    title: 'GDP Growth Rate',
    description: 'Quarterly GDP preliminary reading',
    impact: 'high',
    country: 'US',
    category: 'Economic Growth',
    forecast: '2.1%',
    previous: '2.8%',
  });

  events.push({
    id: 'inflation',
    time: '08:30',
    date: addDays(today, 3),
    title: 'Consumer Price Index',
    description: 'Monthly inflation data',
    impact: 'high',
    country: 'US',
    category: 'Inflation',
    forecast: '3.2%',
    previous: '3.4%',
  });

  // Fed events
  events.push({
    id: 'fed-meeting',
    time: '14:00',
    date: addDays(today, 7),
    title: 'FOMC Meeting',
    description: 'Federal Reserve interest rate decision',
    impact: 'high',
    country: 'US',
    category: 'Central Bank',
    forecast: '5.25%',
    previous: '5.25%',
  });

  // Earnings
  events.push({
    id: 'earnings-aapl',
    time: '16:30',
    date: addDays(today, 1),
    title: 'Apple Inc. Earnings',
    description: 'Q4 2024 earnings report',
    impact: 'high',
    country: 'US',
    category: 'Earnings',
  });

  events.push({
    id: 'earnings-msft',
    time: '16:00',
    date: addDays(today, 2),
    title: 'Microsoft Corp. Earnings',
    description: 'Q4 2024 earnings report',
    impact: 'high',
    country: 'US',
    category: 'Earnings',
  });

  return events.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }
    return a.time.localeCompare(b.time);
  });
};

export function EconomicCalendar({ maxEvents = 10, className }: EconomicCalendarProps) {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    // In a real app, this would fetch from an API
    const mockEvents = generateMockEvents();
    setEvents(mockEvents.slice(0, maxEvents));
  }, [maxEvents]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-danger text-danger-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      case 'low':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <AlertCircle className="h-3 w-3" />;
      case 'medium':
        return <Bell className="h-3 w-3" />;
      case 'low':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Market Hours':
        return <Clock className="h-3 w-3" />;
      case 'Central Bank':
        return <AlertCircle className="h-3 w-3" />;
      case 'Earnings':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const groupEventsByDate = (events: EconomicEvent[]) => {
    const grouped: { [key: string]: EconomicEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  };

  const groupedEvents = groupEventsByDate(events);

  if (events.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center text-muted-foreground", className)}>
        <div className="text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm font-medium mb-1">No Events Scheduled</div>
          <div className="text-xs">No upcoming economic events</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <h3 className="text-sm font-medium">Economic Calendar</h3>
          <Badge variant="outline" className="text-xs">
            {events.length} events
          </Badge>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {format(new Date(), 'MMM dd, yyyy')}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
          const date = new Date(dateKey);
          
          return (
            <div key={dateKey} className="space-y-2">
              {/* Date Header */}
              <div className="sticky top-0 bg-background py-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "text-xs font-medium px-2 py-1 rounded",
                    isToday(date) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {getDateLabel(date)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(date, 'EEEE')}
                  </div>
                </div>
              </div>

              {/* Day Events */}
              <div className="space-y-1 pl-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    {/* Time */}
                    <div className="text-xs font-mono text-muted-foreground min-w-[45px]">
                      {event.time}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(event.category)}
                          <span className="text-sm font-medium">{event.title}</span>
                        </div>
                        
                        <Badge 
                          className={cn("text-xs", getImpactColor(event.impact))}
                        >
                          <span className="flex items-center gap-1">
                            {getImpactIcon(event.impact)}
                            {event.impact}
                          </span>
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1">
                        {event.description}
                      </p>

                      {/* Economic Data */}
                      {(event.forecast || event.previous || event.actual) && (
                        <div className="flex items-center gap-3 text-xs">
                          {event.forecast && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Forecast:</span>
                              <span className="font-medium">{event.forecast}</span>
                            </div>
                          )}
                          {event.previous && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Previous:</span>
                              <span>{event.previous}</span>
                            </div>
                          )}
                          {event.actual && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Actual:</span>
                              <span className="font-medium text-primary">{event.actual}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {event.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{event.country}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-danger" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-warning" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-success" />
              <span>Low</span>
            </div>
          </div>
          <div>Impact Level</div>
        </div>
      </div>
    </div>
  );
}