using SaasV2.Core.Enums;
using System.Collections.Generic;

namespace SaasV2.Core.Payments
{
    public class PaymentResult
    {
        public PaymentStatus Status { get; init; }
        public string? PaymentReference { get; init; }
        public bool RequiresAction { get; init; }
        public string? ErrorCode { get; init; }
        public string? ErrorMessage { get; init; }
        public IDictionary<string, string>? Metadata { get; init; }

        public static PaymentResult Success(string? reference = null, IDictionary<string, string>? metadata = null) =>
            new()
            {
                Status = PaymentStatus.Succeeded,
                PaymentReference = reference,
                Metadata = metadata
            };

        public static PaymentResult RequireAction(string? reference, IDictionary<string, string>? metadata = null) =>
            new()
            {
                Status = PaymentStatus.RequiresAction,
                PaymentReference = reference,
                RequiresAction = true,
                Metadata = metadata
            };

        public static PaymentResult Failed(string? errorCode, string? errorMessage, IDictionary<string, string>? metadata = null) =>
            new()
            {
                Status = PaymentStatus.Failed,
                ErrorCode = errorCode,
                ErrorMessage = errorMessage,
                Metadata = metadata
            };
    }
}

