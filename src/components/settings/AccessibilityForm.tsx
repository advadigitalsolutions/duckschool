import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccessibilityControls } from '@/components/AccessibilityControls';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useBionicReading } from '@/contexts/BionicReadingContext';
export function AccessibilityForm() {
  const {
    enabled: bionicEnabled,
    setEnabled: setBionicEnabled
  } = useBionicReading();
  const {
    dyslexiaFontEnabled,
    lineSpacing,
    letterSpacing,
    colorOverlay,
    focusModeEnabled,
    focusModeOverlayOpacity,
    focusModeGlowColor,
    focusModeGlowIntensity,
    readingRulerEnabled,
    textToSpeechEnabled,
    textToSpeechVoice,
    highContrastEnabled,
    showTimeEstimates,
    setDyslexiaFont,
    setLineSpacing,
    setLetterSpacing,
    setColorOverlay,
    setFocusMode,
    setFocusModeOverlayOpacity,
    setFocusModeGlowColor,
    setFocusModeGlowIntensity,
    setReadingRuler,
    setTextToSpeech,
    setTextToSpeechVoice,
    setHighContrast,
    setShowTimeEstimates
  } = useAccessibility();
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Access Controls</CardTitle>
          <CardDescription>Toggle accessibility features with keyboard shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <AccessibilityControls />
        </CardContent>
      </Card>

      

      <Card>
        <CardHeader>
          <CardTitle>Text Spacing</CardTitle>
          <CardDescription>Adjust spacing for comfortable reading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="line-spacing">Line Spacing</Label>
            <Select value={lineSpacing} onValueChange={setLineSpacing}>
              <SelectTrigger id="line-spacing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="1.5x">1.5x</SelectItem>
                <SelectItem value="2x">2x</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="letter-spacing">Letter Spacing</Label>
            <Select value={letterSpacing} onValueChange={setLetterSpacing}>
              <SelectTrigger id="letter-spacing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
                <SelectItem value="wider">Wider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visual Adjustments</CardTitle>
          <CardDescription>Customize colors and visual focus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="color-overlay">Color Overlay</Label>
            <Select value={colorOverlay} onValueChange={setColorOverlay}>
              <SelectTrigger id="color-overlay">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="cream">Cream</SelectItem>
                <SelectItem value="mint">Mint</SelectItem>
                <SelectItem value="lavender">Lavender</SelectItem>
                <SelectItem value="peach">Peach</SelectItem>
                <SelectItem value="aqua">Aqua</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="high-contrast">High Contrast Mode</Label>
              <p className="text-xs text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch id="high-contrast" checked={highContrastEnabled} onCheckedChange={setHighContrast} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="show-time-estimates">Show Time Estimates</Label>
              <p className="text-xs text-muted-foreground">
                Display estimated time for assignments and tasks
              </p>
            </div>
            <Switch id="show-time-estimates" checked={showTimeEstimates} onCheckedChange={setShowTimeEstimates} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="focus-mode">Focus Mode</Label>
              <p className="text-xs text-muted-foreground">
                Highlight current paragraph with dimmed surroundings
              </p>
            </div>
            <Switch id="focus-mode" checked={focusModeEnabled} onCheckedChange={setFocusMode} />
          </div>

          {focusModeEnabled && <div className="space-y-4 pl-4">
              <div className="space-y-2">
                <Label>Overlay Opacity: {focusModeOverlayOpacity}%</Label>
                <Slider value={[focusModeOverlayOpacity]} onValueChange={([value]) => setFocusModeOverlayOpacity(value)} min={0} max={100} step={5} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="glow-color">Glow Color</Label>
                <Select value={focusModeGlowColor} onValueChange={setFocusModeGlowColor}>
                  <SelectTrigger id="glow-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="rainbow">Rainbow</SelectItem>
                    <SelectItem value="trans">Trans Pride</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Glow Intensity: {focusModeGlowIntensity}%</Label>
                <Slider value={[focusModeGlowIntensity]} onValueChange={([value]) => setFocusModeGlowIntensity(value)} min={0} max={200} step={10} />
              </div>
            </div>}
        </CardContent>
      </Card>
    </div>;
}