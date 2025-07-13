import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeliveryForm from '../components/DeliveryForm';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: 'Delivery created successfully!' }),
  })
);

global.alert = jest.fn();

describe('DeliveryForm Component', () => {
  afterEach(() => {
    fetch.mockClear();
    alert.mockClear();
  });

  test('shows validation errors on empty form submission', async () => {
    render(<DeliveryForm />);
    fireEvent.submit(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText('Order ID is required')).toBeInTheDocument();
    expect(await screen.findByText('Status is required')).toBeInTheDocument();
    expect(
      await screen.findByText('Customer name is required')
    ).toBeInTheDocument();
  });

  test('submits the form with valid data', async () => {
    render(<DeliveryForm />);

    fireEvent.change(screen.getByLabelText(/order id:/i), {
      target: { value: 'DEL123' },
    });
    fireEvent.change(screen.getByLabelText(/status:/i), {
      target: { value: 'Pending' },
    });
    fireEvent.change(screen.getByLabelText(/customer:/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(alert).toHaveBeenCalledWith('Delivery created successfully!');
  });

  test('displays error message if server fails', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({ message: 'Failed to connect to the server.' }),
      })
    );

    render(<DeliveryForm />);
    fireEvent.submit(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Failed to connect to the server.')
    );
  });
});
