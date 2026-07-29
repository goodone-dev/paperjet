import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppWorkspace from '@/components/paperjet/AppWorkspace';
import { Toaster } from '@/components/ui/sonner';

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AppWorkspace />} />
                    <Route path="*" element={<AppWorkspace />} />
                </Routes>
            </BrowserRouter>
            <Toaster />
        </div>
    );
}

export default App;
