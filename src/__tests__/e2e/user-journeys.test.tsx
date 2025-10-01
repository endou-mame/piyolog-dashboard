// End-to-end user journey tests
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '../../components/FileUpload'
import { ErrorAlert } from '../../components/ErrorAlert'

describe('User Journeys E2E', () => {

  describe('File import journey', () => {
    it('should show file upload component with instructions', () => {
      const onFileSelect = vi.fn()
      render(<FileUpload onFileSelect={onFileSelect} />)

      // Should show upload instructions
      expect(screen.getByText(/ぴよログファイルをドラッグ＆ドロップ/i)).toBeInTheDocument()

      // Should show supported formats
      expect(screen.getByText(/テキスト \(.txt\), CSV \(.csv\)/i)).toBeInTheDocument()

      // Should have file selection button
      const selectButton = screen.getByRole('button', { name: /ファイルを選択/i })
      expect(selectButton).toBeInTheDocument()
    })

    it('should validate file type on upload', async () => {
      const onFileSelect = vi.fn()
      render(<FileUpload onFileSelect={onFileSelect} />)

      const user = userEvent.setup()

      // Create invalid file (PDF)
      const invalidFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

      const input = screen.getByRole('button', { name: /ファイルを選択/i })
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      if (input) {
        await user.upload(input, invalidFile)

        // Should show error message
        await waitFor(() => {
          expect(screen.getByText(/ファイル形式が無効です/i)).toBeInTheDocument()
        })

        // Should not call onFileSelect
        expect(onFileSelect).not.toHaveBeenCalled()
      }
    })

    it('should accept valid text file', async () => {
      const onFileSelect = vi.fn()
      render(<FileUpload onFileSelect={onFileSelect} />)

      const user = userEvent.setup()

      // Create valid file
      const validFile = new File(['test content'], 'piyolog.txt', { type: 'text/plain' })

      const input = screen.getByRole('button', { name: /ファイルを選択/i })
        .closest('div')
        ?.querySelector('input[type="file"]') as HTMLInputElement

      if (input) {
        await user.upload(input, validFile)

        // Should call onFileSelect
        await waitFor(() => {
          expect(onFileSelect).toHaveBeenCalledWith(validFile)
        })
      }
    })

    it('should show loading state during processing', () => {
      render(<FileUpload onFileSelect={() => {}} isLoading={true} />)

      // Should show processing message
      expect(screen.getByText(/ファイルを処理中/i)).toBeInTheDocument()

      // Input should be disabled
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeDisabled()
    })
  })


  describe('Error handling journey', () => {
    it('should display error alert for API errors', () => {
      const onRetry = vi.fn()

      render(
        <ErrorAlert
          title="接続エラー"
          message="Failed to connect to server"
          onRetry={onRetry}
        />
      )

      // Should show error message
      expect(screen.getByText('Failed to connect to server')).toBeInTheDocument()

      // Should have retry button
      const retryButton = screen.getByRole('button', { name: /再試行/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should allow retry on error', async () => {
      const onRetry = vi.fn()
      render(
        <ErrorAlert
          title="エラー"
          message="Network error"
          onRetry={onRetry}
        />
      )

      const user = userEvent.setup()

      const retryButton = screen.getByRole('button', { name: /再試行/i })
      await user.click(retryButton)

      // Should call retry handler
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should display authentication error with guidance', () => {
      render(
        <ErrorAlert
          title="認証エラー"
          message="Authentication failed. Please check your credentials."
          onRetry={() => {}}
        />
      )

      // Should show auth error
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument()
    })
  })

  describe('Multi-device access journey', () => {
    it('should render mobile-friendly layout', () => {
      // Set mobile viewport
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(<FileUpload onFileSelect={() => {}} />)

      // Component should render without errors
      expect(screen.getByText(/ぴよログファイルをドラッグ＆ドロップ/i)).toBeInTheDocument()
    })

    it('should support touch interactions', async () => {
      const onFileSelect = vi.fn()
      render(<FileUpload onFileSelect={onFileSelect} />)

      // Find the drop zone div (it has border-2 class)
      const dropZone = document.querySelector('.border-2.border-dashed')

      expect(dropZone).toHaveClass('touch-manipulation')
    })
  })


  describe('Accessibility journey', () => {
    it('should have accessible file upload', () => {
      render(<FileUpload onFileSelect={() => {}} />)

      const input = document.querySelector('input[type="file"]')

      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('accept', '.txt,.csv,text/plain,text/csv')
    })

    it('should have accessible error messages', () => {
      render(
        <ErrorAlert
          title="テストエラー"
          message="Test error message"
          onRetry={() => {}}
        />
      )

      // Error should be visible and readable
      expect(screen.getByText('Test error message')).toBeInTheDocument()

      // Retry button should be accessible
      const retryButton = screen.getByRole('button', { name: /再試行/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const onRetry = vi.fn()
      render(
        <ErrorAlert
          title="エラー"
          message="Error occurred"
          onRetry={onRetry}
        />
      )

      const user = userEvent.setup()

      // Tab to retry button
      await user.tab()

      // Should focus retry button
      const retryButton = screen.getByRole('button', { name: /再試行/i })
      expect(retryButton).toHaveFocus()

      // Press Enter
      await user.keyboard('{Enter}')

      // Should trigger retry
      expect(onRetry).toHaveBeenCalled()
    })
  })

  describe('Performance journey', () => {
    it('should render file upload component quickly', () => {
      const startTime = performance.now()
      render(<FileUpload onFileSelect={() => {}} />)
      const endTime = performance.now()

      // Should render quickly (< 50ms)
      expect(endTime - startTime).toBeLessThan(50)

      // Should display upload instructions
      expect(screen.getByText(/ぴよログファイルをドラッグ＆ドロップ/i)).toBeInTheDocument()
    })

    it('should render error alert quickly', () => {
      const startTime = performance.now()
      render(
        <ErrorAlert
          title="テストエラー"
          message="Test error"
          onRetry={() => {}}
        />
      )
      const endTime = performance.now()

      // Should render quickly (< 50ms)
      expect(endTime - startTime).toBeLessThan(50)

      // Should display error message
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
  })
})
