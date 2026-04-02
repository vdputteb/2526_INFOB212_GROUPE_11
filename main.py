from textual.app import App, ComposeResult
from textual.containers import Center, Middle
from textual.widgets import Header, Footer, Label
from textual_image.widget import Image

class ResizableImageApp(App[None]):
    TITLE = "Visualiseur d'images"
    SUB_TITLE = "Plein écran avec Textual"
    
    def compose(self) -> ComposeResult:
        yield Header()
        
        with Center():
            with Middle():
                yield Label("Image 1", id="image-title")
                self.image = Image("img/Image1.png")
                self.image.styles.width = "70%"
                self.image.styles.height = "70%"
                yield self.image
        
        yield Footer()
    
    def on_resize(self) -> None:
        """Répondre au redimensionnement de la fenêtre"""
        # Réajuster la taille de l'image si nécessaire
        self.image.styles.width = "70%"
        self.image.styles.height = "70%"
        self.image.refresh()

if __name__ == "__main__":
    app = ResizableImageApp()
    app.run()