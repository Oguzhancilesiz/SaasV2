using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.WebhookDTOs
{
    public class WebhookDeliveryUpdateDTO
    {
        public Guid Id { get; set; }
        public int ResponseStatus { get; set; }
        public string ResponseBody { get; set; }
        public int Retries { get; set; }
    }

}
