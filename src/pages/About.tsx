import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Github, Mail, ExternalLink, Code, TrendingUp, Database, Sparkles, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-purple-500/10">
      {/* Simple Header */}
      <header className="bg-gradient-primary border-b border-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">SmartInvest</h1>
                <p className="text-xs text-white/80">About</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Section */}
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                MA
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold mb-2">Mehroj Alimov</h1>
                <p className="text-xl text-muted-foreground mb-4">
                  Full Stack Developer & Financial Technology Enthusiast
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    Software Engineer
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    FinTech
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Full Stack
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About SmartInvest */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              About SmartInvest
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              SmartInvest is a comprehensive investment portfolio tracker designed to help users monitor their stock investments in real-time. 
              Built with modern web technologies, it provides a seamless experience for tracking portfolio performance, analyzing investments, 
              and making informed financial decisions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Key Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time stock price tracking</li>
                  <li>• Portfolio performance analytics</li>
                  <li>• Interactive charts and visualizations</li>
                  <li>• Transaction history management</li>
                  <li>• Cost basis calculations (FIFO)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Tech Stack</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React + TypeScript + Vite</li>
                  <li>• Node.js + Express</li>
                  <li>• SQLite + Better-SQLite3</li>
                  <li>• TailwindCSS + Shadcn/ui</li>
                  <li>• Yahoo Finance API</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Links */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Connect With Me</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open('https://www.linkedin.com/in/mehrojalimov', '_blank')}
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open('https://github.com/mehrojalimov', '_blank')}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = 'mailto:alimovmekhroj01@gmail.com'}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>© 2025 Mehroj Alimov. All rights reserved.</p>
          <p className="mt-2">Built with ❤️ using React, TypeScript, and modern web technologies.</p>
        </div>
        </div>
      </div>
    </div>
  );
}

