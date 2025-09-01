//
//  MBNotesCryptoModule.m
//  Strata
//
//  Created by Manton Reece on 2/3/24.
//

#import "MBNotesCryptoModule.h"

#import "Strata-Swift.h"

@implementation MBNotesCryptoModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(encryptText:(NSString *)text withKey:(NSString *)key resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  NSData* d = [[self class] dataFromHexString:key];
  
  MBNoteCrypto* crypto = [[MBNoteCrypto alloc] init];
  NSData* encrypted_data = [crypto encryptWithPlaintext:text key:d];

  // convert to base64 encoding
  NSString* s = [encrypted_data base64EncodedStringWithOptions:0];
  resolve(s);
}

RCT_EXPORT_METHOD(decryptText:(NSString *)text withKey:(NSString *)key resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  NSData* keyData = [[self class] dataFromHexString:key];
  NSData* encryptedData = [[NSData alloc] initWithBase64EncodedString:text options:0];
  
  MBNoteCrypto* crypto = [[MBNoteCrypto alloc] init];
  NSString* decryptedText = [crypto decryptWithEncryptedData:encryptedData key:keyData];
  
  if (decryptedText) {
    resolve(decryptedText);
  }
  else {
    reject(@"DECRYPT_ERROR", @"Failed to decrypt the text", nil);
  }
}

+ (NSData *) dataFromHexString:(NSString *)hexString
{
  NSMutableData* result = [[NSMutableData alloc] init];
  unsigned char whole_byte;
  char byte_chars[3] = { '\0','\0','\0' };

  for (int i = 0; i < [hexString length] / 2; i++) {
    byte_chars[0] = [hexString characterAtIndex:i*2];
    byte_chars[1] = [hexString characterAtIndex:i*2 + 1];
    whole_byte = strtol(byte_chars, NULL, 16);
    [result appendBytes:&whole_byte length:1];
  }

  return result;
}

@end
