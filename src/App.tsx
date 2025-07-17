import { useState, useEffect } from 'react'
import { Receipt, MessageSquare } from 'lucide-react'
import { blink } from './blink/client'
import { ReceiptUpload } from './components/ReceiptUpload'
import { ReceiptAnalysis } from './components/ReceiptAnalysis'
import { ChatInterface } from './components/ChatInterface'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { toast } from './hooks/use-toast'

interface ReceiptData {
  merchant: string
  date: string
  total: number
  subtotal?: number
  tax?: number
  items: Array<{
    name: string
    price: number
    quantity?: number
  }>
  category?: string
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const analyzeReceipt = async (file: File) => {
    setIsAnalyzing(true)
    try {
      // Upload the image to storage first
      const { publicUrl } = await blink.storage.upload(file, `receipts/${file.name}`, {
        upsert: true
      })

      // Use AI to analyze the receipt image
      const { text } = await blink.ai.generateText({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information. Return ONLY valid JSON without any markdown formatting, code blocks, or additional text:

{
  "merchant": "store name",
  "date": "date in MM/DD/YYYY format",
  "total": number,
  "subtotal": number (if available),
  "tax": number (if available),
  "items": [
    {
      "name": "item name",
      "price": number,
      "quantity": number (if available)
    }
  ],
  "category": "category like 'Grocery', 'Restaurant', 'Gas', etc."
}

IMPORTANT: Return only the JSON object, no markdown code blocks, no explanations, no additional text.`
              },
              {
                type: "image",
                image: publicUrl
              }
            ]
          }
        ]
      })

      // Parse the AI response - clean markdown formatting first
      let cleanedText = text.trim()
      try {
        // Remove markdown code blocks if present
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        const parsedData = JSON.parse(cleanedText)
        
        // Validate that we have the required fields
        if (!parsedData.merchant || !parsedData.total || !parsedData.items) {
          throw new Error('Missing required fields in AI response')
        }
        
        setReceiptData(parsedData)
        
        // Store the receipt data in the database (optional - continue if it fails)
        try {
          await blink.db.receipts.create({
            userId: user.id,
            merchant: parsedData.merchant,
            date: parsedData.date,
            total: parsedData.total,
            subtotal: parsedData.subtotal || 0,
            tax: parsedData.tax || 0,
            items: JSON.stringify(parsedData.items),
            category: parsedData.category || 'Other',
            imageUrl: publicUrl,
            createdAt: new Date().toISOString()
          })
        } catch (dbError) {
          console.warn('Failed to store receipt in database:', dbError)
          // Continue anyway - the analysis still works without database storage
        }

        toast({
          title: "Receipt analyzed successfully!",
          description: `Found ${parsedData.items.length} items from ${parsedData.merchant}`
        })
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        console.error('Raw AI response:', text)
        console.error('Cleaned text:', cleanedText)
        toast({
          title: "Analysis failed",
          description: "Could not parse the receipt data. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Receipt analysis failed:', error)
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the receipt. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleChatMessage = async (message: string): Promise<string> => {
    if (!receiptData) {
      return "Please upload a receipt first to start chatting about it."
    }

    try {
      const { text } = await blink.ai.generateText({
        prompt: `You are an AI assistant helping users understand their receipt data. 
        
        Here is the receipt data:
        Merchant: ${receiptData.merchant}
        Date: ${receiptData.date}
        Total: $${receiptData.total}
        Items: ${receiptData.items.map(item => `${item.name} - $${item.price}`).join(', ')}
        Category: ${receiptData.category}
        
        User question: ${message}
        
        Please provide a helpful response about their receipt, spending patterns, or answer their specific question. Be conversational and helpful.`
      })

      return text
    } catch (error) {
      console.error('Chat message failed:', error)
      return "Sorry, I encountered an error processing your message. Please try again."
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Receipt className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Receipt Analyzer</h1>
          <p className="text-gray-600 mb-6">Please sign in to analyze your receipts</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Receipt className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Receipt Analyzer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={() => blink.auth.logout()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Analysis */}
          <div className="space-y-6">
            <ReceiptUpload onUpload={analyzeReceipt} isAnalyzing={isAnalyzing} />
            <ReceiptAnalysis data={receiptData} isLoading={isAnalyzing} />
          </div>

          {/* Right Column - Chat Interface */}
          <div>
            <ChatInterface 
              receiptData={receiptData} 
              onSendMessage={handleChatMessage}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App