import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../theme-provider"; // Import Theme type
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Removed unused DialogDescription
import { useState } from "react";

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [showDialog, setShowDialog] = useState(false);
  const messages = [
	  "I declare... LIGHT MODE!",
	  "The light theme is coming ",
	  "I choose you... light theme!",
	  "May the force... not blind you",
	  "That's what she said! (About brightness)",
  ];
  

  const getRandomMessage = () => {
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleThemeChange = (targetTheme: Theme) => {
    if (targetTheme === "light" && theme !== "light") {
      setShowDialog(true);
    } else {
      setTheme(targetTheme);
    }
  };

  const confirmThemeChange = () => {
    setTheme("light");
    setShowDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleThemeChange("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleThemeChange("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">
					Caution !
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-center text-lg">
              {getRandomMessage()}
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
            >
				<b>
	              Abort
				</b>
            </Button>
            <Button 
              onClick={confirmThemeChange}
              variant="default"
            >
				<b>
	              Bring on
				</b>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}