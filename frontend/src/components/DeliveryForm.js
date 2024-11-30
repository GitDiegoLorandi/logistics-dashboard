import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

// Validation schema using Yup
const validationSchema = Yup.object({
  orderId: Yup.string().required("Order ID is required"),
  status: Yup.string()
    .oneOf(["Pending", "In Transit", "Delivered"], "Invalid status")
    .required("Status is required"),
  customer: Yup.string().required("Customer name is required"),
});

const DeliveryForm = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid }, reset } = useForm({
    resolver: yupResolver(validationSchema),
    mode: "onChange", // Real-time validation
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);

  const onSubmit = async (data) => {
    try {
      const response = await fetch("http://localhost:5000/api/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        setSubmitSuccess(true);
        alert("Delivery created successfully!");
        reset();
      } else {
        alert(result.message || "Failed to create delivery.");
      }
    } catch (error) {
      console.error("Error creating delivery:", error);
      alert("Failed to connect to the server.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
      <label htmlFor="orderId">Order ID:</label>
      <input id="orderId" {...register("orderId")} />
      {errors.orderId && <p>{errors.orderId.message}</p>}
      </div>

      <div>
        <label htmlFor="status">Status:</label>
        <select id="status" {...register("status")}>
          <option value="">Select status</option>
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
        {errors.status && <p className="error-message">{errors.status.message}</p>}
      </div>

      <div>
        <label htmlFor="customer">Customer:</label>
        <input id="customer" {...register("customer")} />
        {errors.customer && <p className="error-message">{errors.customer.message}</p>}
      </div>

      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? <div className="spinner"></div> : "Submit"}
      </button>

      {submitSuccess && <p className="success-message">Delivery created successfully!</p>}
    </form>
  );
};

export default DeliveryForm;
