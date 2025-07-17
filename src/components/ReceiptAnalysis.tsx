import { Receipt, Store, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

interface ReceiptItem {
  name: string
  price: number
  quantity?: number
}

interface ReceiptData {
  merchant: string
  date: string
  total: number
  subtotal?: number
  tax?: number
  items: ReceiptItem[]
  category?: string
}

interface ReceiptAnalysisProps {
  data: ReceiptData | null
  isLoading: boolean
}

export function ReceiptAnalysis({ data, isLoading }: ReceiptAnalysisProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Analyzing Receipt...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Upload a receipt to see analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="h-5 w-5" />
          <span>Receipt Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Store className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Merchant</p>
              <p className="font-semibold text-gray-900">{data.merchant}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Calendar className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">{data.date}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-semibold text-gray-900">${data.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Category */}
        {data.category && (
          <div>
            <Badge variant="secondary" className="mb-4">
              {data.category}
            </Badge>
          </div>
        )}

        {/* Items List */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
          <div className="space-y-2">
            {data.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <div className="flex-1">
                  <span className="text-gray-900">{item.name}</span>
                  {item.quantity && (
                    <span className="text-sm text-gray-500 ml-2">
                      (x{item.quantity})
                    </span>
                  )}
                </div>
                <span className="font-medium text-gray-900">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="pt-4 border-t">
          <div className="space-y-2">
            {data.subtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${data.subtotal.toFixed(2)}</span>
              </div>
            )}
            {data.tax && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${data.tax.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${data.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}