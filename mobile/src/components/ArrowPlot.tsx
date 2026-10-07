import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ArrowPlotProps {
  sessions: any[];
  bowType?: string;
}

export default function ArrowPlot({ sessions, bowType = "Recurve" }: ArrowPlotProps) {
  const isCompound = bowType.toLowerCase().includes("compound");

  const arrows = useMemo(() => {
    let allArrows: any[] = [];
    sessions.forEach(session => {
      if (session.arrowData) {
        try {
          const parsed = JSON.parse(session.arrowData);
          allArrows = allArrows.concat(parsed.flat());
        } catch (e) {
          // ignore parsing error
        }
      }
    });
    return allArrows;
  }, [sessions]);

  const windowWidth = Dimensions.get('window').width;
  const size = Math.min(windowWidth - 40, 320);
  const center = size / 2;

  // Scale coordinates from original web 230x230 to the new size
  const scale = size / 230;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Grouping Heatmap</ThemedText>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>
            {isCompound ? "Compound (5-10)" : "Recurve (1-10)"}
          </ThemedText>
        </View>
      </View>

      <View style={styles.plotContainer}>
        <Svg width={size} height={size} viewBox="0 0 230 230">
          {isCompound ? (
            <G>
              <Rect x="0" y="0" width="230" height="230" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <Circle cx="115" cy="115" r="96" fill="#0284C7" stroke="#000000" strokeWidth="1.2" />
              <Circle cx="115" cy="115" r="80" fill="none" stroke="#000000" strokeWidth="0.8" />
              <Circle cx="115" cy="115" r="64" fill="#EF4444" stroke="#000000" strokeWidth="1.0" />
              <Circle cx="115" cy="115" r="48" fill="none" stroke="#000000" strokeWidth="0.8" />
              <Circle cx="115" cy="115" r="32" fill="#FACC15" stroke="#000000" strokeWidth="1.0" />
              <Circle cx="115" cy="115" r="16" fill="none" stroke="#000000" strokeWidth="0.8" />
              <Circle cx="115" cy="115" r="8" fill="none" stroke="#000000" strokeWidth="0.8" />
              
              <Line x1="112" y1="115" x2="118" y2="115" stroke="#000000" strokeWidth="0.75" />
              <Line x1="115" y1="112" x2="115" y2="118" stroke="#000000" strokeWidth="0.75" />
            </G>
          ) : (
            <G>
              <Circle cx="115" cy="115" r="110" fill="#FFFFFF" />
              <Circle cx="115" cy="115" r="99" fill="none" stroke="rgba(0,0,0,.15)" strokeWidth="0.8" />
              <Circle cx="115" cy="115" r="88" fill="#000000" />
              <Circle cx="115" cy="115" r="77" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="0.8" />
              <Circle cx="115" cy="115" r="66" fill="#0EA5E9" />
              <Circle cx="115" cy="115" r="55" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="0.8" />
              <Circle cx="115" cy="115" r="44" fill="#E53935" />
              <Circle cx="115" cy="115" r="33" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="0.8" />
              <Circle cx="115" cy="115" r="22" fill="#FFD700" />
              <Circle cx="115" cy="115" r="11" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="0.9" />
              <Circle cx="115" cy="115" r="5.5" fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="0.75" />
              
              <Line x1="112.5" y1="115" x2="117.5" y2="115" stroke="rgba(0,0,0,.7)" strokeWidth="0.75" />
              <Line x1="115" y1="112.5" x2="115" y2="117.5" stroke="rgba(0,0,0,.7)" strokeWidth="0.75" />
            </G>
          )}

          <G>
            {arrows.map((arrow, i) => {
              if (arrow.cx == null || arrow.cy == null) return null;
              return (
                <Circle 
                  key={i}
                  cx={arrow.cx} 
                  cy={arrow.cy} 
                  r="3.2" 
                  fill="#FFFFFF" 
                  fillOpacity="0.9"
                  stroke="#000000" 
                  strokeWidth="0.7" 
                />
              );
            })}
          </G>
        </Svg>
      </View>
      
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>Total Recorded Arrows: {arrows.length}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  badge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  badgeText: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: 'bold',
  },
  plotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    width: '100%',
    marginTop: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
  },
});
