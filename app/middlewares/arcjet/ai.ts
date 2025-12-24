import aj, { detectBot, sensitiveInfo, shield, slidingWindow } from '@/lib/arject'
import { base } from '../base';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types';

const buildAiAj = ()=> aj.withRule(
    shield({
        mode:"LIVE",
    })
).withRule(
    slidingWindow({
        mode:"LIVE",
        interval:"1m",
        max: 3,
        
    })
).withRule(
    detectBot({
            mode:"LIVE",
            allow: [`CATEGORY:SEARCH_ENGINE`, `CATEGORY:PREVIEW` ]

    })
).withRule(
    sensitiveInfo({
        mode:"LIVE",
        deny:['PHONE_NUMBER',"CREDIT_CARD_NUMBER"]
    })
)
export const aiSecurityMiddleware = base.
$context<{
    request: Request;
    user: KindeUser<Record<string, unknown>>;
}>()
.middleware(async({context, next, errors}) => {
    const decision = await buildAiAj().protect(context.request, {
        userId: context.user.id,
         
    });
    if (decision.isDenied()){
        if (decision.reason.isSensitiveInfo()){
            throw errors.BAD_REQUEST({
                message:"Sensitive Information detected, please remove PII (e.g. creadit card, phone numbers)",
            })
            
             
        }

        if(decision.reason.isRateLimit()){
            throw errors.RATE_LIMITED({
                message:"Too many Requests, Please wait and try again"
            })

        }

        if(decision.reason.isBot()){
            throw errors.FORBIDDEN({
                message:"Automated traffic blocked"


            });

        }

        if(decision.reason.isShield()){
            throw errors.FORBIDDEN({
                message: 'Reques Blocked by Security (WAF)'
            })

        }
        //global error case:
        throw errors.FORBIDDEN({
            message:`Request Blocked`
        })
    }
    //good user
    return next()





});